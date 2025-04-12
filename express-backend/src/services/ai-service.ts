// src/services/ai-service.ts
import OpenAI from 'openai';
import logger, { createLogger } from '../utils/logger';
import { apiCache } from '../utils/cache';
import config from '../config';
import { generateSearchPrompt, generateExplanationPrompt, generateTariffChangePrompt, generateProductCategoryPrompt } from '../utils/prompt-templates';
import { supabase } from '../utils/database';
import { metrics } from '../monitoring/metrics-manager';

const loga = createLogger('ai-service',logger);
const CACHE_KEY_PREFIX = 'ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || config.apis.openai.apiKey,
});

/**
 * Interface for HTS match results
 */
export interface HTSMatch {
  htsCode: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

/**
 * Interface for tariff explanation results
 */
export interface TariffExplanation {
  plainLanguage: string;
  costImpact: string;
  alternatives?: string;
  technicalDetails?: string;
  historicalTrend?: string;
}

/**
 * Interface for product categorization
 */
export interface ProductCategorization {
  category: string;
  subCategory?: string;
  confidence: 'high' | 'medium' | 'low';
  keywords: string[];
  commonNames: string[];
  searchableTerms: string;
}

/**
 * Record AI usage metrics
 */
async function recordAIUsage(feature: string, tokensUsed: number, requestTime: number, success: boolean, metadata?: any): Promise<void> {
  try {
    // Track in metrics system
    metrics.apiRequestsTotal.inc({ 
      endpoint: 'openai', 
      method: feature,
      status_code: success ? 'success' : 'error'
    });
    
    metrics.apiRequestDuration.observe({ 
      endpoint: 'openai', 
      method: feature
    }, requestTime);
    
    // Record in database if enabled
    if (config.apis.openai.trackUsage) {
      await supabase
        .from('ai_usage_metrics')
        .insert({
          feature,
          tokens_used: tokensUsed,
          request_time: requestTime,
          success,
          metadata
        });
    }
  } catch (error:any) {
    loga.error(`Error recording AI usage metrics: ${error.message}`, error);
    // Non-critical error, don't throw
  }
}

/**
 * AI-powered search to convert natural language queries to HTS codes
 */
export async function enhanceSearch(query: string): Promise<{
  htsMatches: HTSMatch[];
  enhancedQuery: string;
}> {
  try {
    // Start timing for metrics
    const startTime = process.hrtime();
    
    // Check cache first
    const cacheKey = `${CACHE_KEY_PREFIX}:search:${query.toLowerCase().trim()}`;
    const cachedResult = apiCache.get(cacheKey) as { htsMatches: HTSMatch[]; enhancedQuery: string };
    
    if (cachedResult) {
      loga.debug(`Cache hit for AI search: ${query}`);
      return cachedResult;
    }
    
    // Check if we have previous cached mappings in the database
    const { data: cachedMapping, error: dbError } = await supabase
      .from('ai_search_mappings')
      .select('*')
      .ilike('query', query.trim().toLowerCase())
      .single();
      
    if (!dbError && cachedMapping) {
      logger.debug(`Database cache hit for AI search: ${query}`);
      
      // Update usage count
      await supabase
        .from('ai_search_mappings')
        .update({ 
          usage_count: cachedMapping.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', cachedMapping.id);
      
      return {
        htsMatches: cachedMapping.mapping_data.htsMatches || [],
        enhancedQuery: cachedMapping.enhanced_query || query
      };
    }
    
    loga.info(`Performing AI-enhanced search for: ${query}`);
    
    // Generate the search prompt
    const prompt = generateSearchPrompt(query);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant specialized in US import tariffs and HTS classification.' },
        { role: 'user', content: prompt }
      ],
      temperature: config.apis.openai.temperature,
      max_tokens: config.apis.openai.maxTokens,
      response_format: { type: 'json_object' }
    });
    
    // Calculate duration
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record usage metrics
    await recordAIUsage(
      'enhance_search',
      response.usage?.total_tokens || 0,
      durationSeconds,
      true,
      { query }
    );
    
    // Parse the response
    const content = response.choices[0].message.content;
    const result = content ? JSON.parse(content) : { htsMatches: [], enhancedQuery: query };
    
    // Cache the result
    apiCache.set(cacheKey, result, 3600); // Cache for 1 hour
    
    // Store in database for long-term caching
    if (result.htsMatches && result.htsMatches.length > 0) {
      await supabase
        .from('ai_search_mappings')
        .upsert({
          query: query.trim().toLowerCase(),
          mapped_hts_codes: result.htsMatches.map((match: any) => match.htsCode),
          enhanced_query: result.enhancedQuery,
          mapping_data: result,
          usage_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'query'
        });
    }
    
    return result;
  } catch (error:any) {
    loga.error(`Error in AI-enhanced search: ${error.message}`, error);
    
    // Record error metrics
    const hrDuration = process.hrtime();
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    await recordAIUsage('enhance_search', 0, durationSeconds, false, { query, error: error.message });
    
    // Return empty result on error
    return { htsMatches: [], enhancedQuery: query };
  }
}

/**
 * Generate natural language explanation of tariff information
 */
export async function explainTariff(
  productInfo: any,
  countryInfo: any = null,
  rateInfo: any = null,
  historyData: any[] = []
): Promise<TariffExplanation> {
  try {
    // Start timing for metrics
    const startTime = process.hrtime();
    
    // Create cache key from combination of product, country, and rate info
    const productId = productInfo.id || 'unknown';
    const countryId = countryInfo?.id || 'all';
    const rateHash = rateInfo ? `${rateInfo.baseRate || 0}-${rateInfo.totalRate || 0}` : 'default';
    
    const cacheKey = `${CACHE_KEY_PREFIX}:explain:${productId}:${countryId}:${rateHash}`;
    const cachedResult = apiCache.get<TariffExplanation>(cacheKey);
    
    if (cachedResult) {
      loga.debug(`Cache hit for tariff explanation: ${productInfo.htsCode || productInfo.hts_code}`);
      return cachedResult;
    }
    
    // Check for stored explanation in database
    const { data: storedExplanation, error: dbError } = await supabase
      .from('ai_explanations')
      .select('*')
      .eq('product_id', productId)
      .eq('country_id', countryId || null)
      .single();
      
    if (!dbError && storedExplanation && new Date(storedExplanation.expires_at) > new Date()) {
      loga.debug(`Database cache hit for tariff explanation: ${productInfo.htsCode || productInfo.hts_code}`);
      
      return {
        plainLanguage: storedExplanation.plain_language,
        costImpact: storedExplanation.cost_impact,
        alternatives: storedExplanation.alternatives,
        technicalDetails: storedExplanation.technical_details,
        historicalTrend: storedExplanation.historical_trend
      };
    }
    
    loga.info(`Generating tariff explanation for: ${productInfo.htsCode || productInfo.hts_code}`);
    
    // Ensure we have normalized product info format
    const normalizedProduct = normalizeProductInfo(productInfo);
    const normalizedCountry = countryInfo ? normalizeCountryInfo(countryInfo) : null;
    const normalizedRate = rateInfo ? normalizeRateInfo(rateInfo, productInfo) : null;
    
    // Generate the explanation prompt
    const prompt = generateExplanationPrompt(
      normalizedProduct, 
      normalizedCountry, 
      normalizedRate || normalizedProduct,
      historyData
    );
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant specialized in explaining US import tariffs in simple language.' },
        { role: 'user', content: prompt }
      ],
      temperature: config.apis.openai.temperature,
      max_tokens: config.apis.openai.maxTokens,
      response_format: { type: 'json_object' }
    });
    
    // Calculate duration
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record usage metrics
    await recordAIUsage(
      'explain_tariff',
      response.usage?.total_tokens || 0,
      durationSeconds,
      true,
      { productId, countryId }
    );
    
    // Parse the response
    const content = response.choices[0].message.content;
    const result: TariffExplanation = content ? JSON.parse(content) : {
      plainLanguage: "No explanation available at this time.",
      costImpact: "Unable to calculate cost impact.",
      technicalDetails: "Please refer to the official rates displayed."
    };
    
    // Cache the result
    apiCache.set<TariffExplanation>(cacheKey, result, 3600 * 24); // Cache for 24 hours
    
    // Store in database for long-term caching
    try {
      await supabase
        .from('ai_explanations')
        .upsert({
          product_id: productId,
          country_id: countryId !== 'all' ? countryId : null,
          plain_language: result.plainLanguage,
          cost_impact: result.costImpact,
          alternatives: result.alternatives,
          technical_details: result.technicalDetails,
          historical_trend: result.historicalTrend,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }, {
          onConflict: 'product_id,country_id'
        });
    } catch (dbError:any) {
      loga.error(`Error storing explanation in database: ${dbError.message}`, dbError);
      // Non-critical error, continue
    }
    
    return result;
  } catch (error:any) {
    loga.error(`Error generating tariff explanation: ${error.message}`, error);
    
    // Record error metrics
    const hrDuration = process.hrtime();
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    await recordAIUsage(
      'explain_tariff',
      0,
      durationSeconds,
      false,
      { 
        productId: productInfo.id || 'unknown',
        countryId: countryInfo?.id || 'all',
        error: error.message
      }
    );
    
    // Return basic explanation on error
    return {
      plainLanguage: "No explanation available at this time.",
      costImpact: "Unable to calculate cost impact.",
      technicalDetails: "Please refer to the official rates displayed."
    };
  }
}

/**
 * Explain tariff changes in plain language
 */
export async function explainTariffChange(
  productInfo: any,
  oldRate: any,
  newRate: any,
  countryInfo?: any
): Promise<string> {
  try {
    // Start timing for metrics
    const startTime = process.hrtime();
    
    // Create cache key
    const productId = productInfo.id || 'unknown';
    const countryId = countryInfo?.id || 'all';
    const oldRateValue = oldRate.totalRate || 0;
    const newRateValue = newRate.totalRate || 0;
    
    const cacheKey = `${CACHE_KEY_PREFIX}:change:${productId}:${countryId}:${oldRateValue}-${newRateValue}`;
    const cachedResult = apiCache.get<string>(cacheKey);
    
    if (cachedResult) {
      loga.debug(`Cache hit for tariff change explanation: ${productInfo.htsCode || productInfo.hts_code}`);
      return cachedResult;
    }
    
    // Generate the prompt
    const prompt = generateTariffChangePrompt(productInfo, oldRate, newRate, countryInfo);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant specialized in explaining US import tariff changes in simple language.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    // Calculate duration
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record usage metrics
    await recordAIUsage(
      'explain_tariff_change',
      response.usage?.total_tokens || 0,
      durationSeconds,
      true,
      { productId, countryId, oldRate: oldRateValue, newRate: newRateValue }
    );
    
    // Get the explanation
    const explanation = response.choices[0].message.content || 
      `The tariff rate for ${productInfo.name} has changed from ${oldRateValue}% to ${newRateValue}%. This represents a ${newRateValue > oldRateValue ? 'increase' : 'decrease'} of ${Math.abs(newRateValue - oldRateValue).toFixed(1)}%.`;
    
    // Cache the result
    apiCache.set(cacheKey, explanation, 3600 * 24); // Cache for 24 hours
    
    return explanation;
  } catch (error:any) {
    loga.error(`Error explaining tariff change: ${error.message}`, error);
    
    // Record error metrics
    const hrDuration = process.hrtime();
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    await recordAIUsage('explain_tariff_change', 0, durationSeconds, false, { error: error.message });
    
    // Return simple explanation on error
    const productName = productInfo.name || 'this product';
    const oldRateValue = oldRate?.totalRate || 0;
    const newRateValue = newRate?.totalRate || 0;
    
    return `The tariff rate for ${productName} has changed from ${oldRateValue}% to ${newRateValue}%. This represents a ${newRateValue > oldRateValue ? 'increase' : 'decrease'} of ${Math.abs(newRateValue - oldRateValue).toFixed(1)}%.`;
  }
}

/**
 * Categorize a product using AI
 */
export async function categorizeProduct(
  htsCode: string,
  description: string
): Promise<ProductCategorization> {
  try {
    // Start timing for metrics
    const startTime = process.hrtime();
    
    // Check cache first
    const cacheKey = `${CACHE_KEY_PREFIX}:categorize:${htsCode}`;
    const cachedResult = apiCache.get<ProductCategorization>(cacheKey);
    
    if (cachedResult) {
      loga.debug(`Cache hit for product categorization: ${htsCode}`);
      return cachedResult;
    }
    
    loga.info(`Categorizing product with HTS code: ${htsCode}`);
    
    // Generate the prompt
    const prompt = generateProductCategoryPrompt(htsCode, description);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant specialized in categorizing products based on HTS codes and descriptions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    
    // Calculate duration
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record usage metrics
    await recordAIUsage(
      'categorize_product',
      response.usage?.total_tokens || 0,
      durationSeconds,
      true,
      { htsCode }
    );
    
    // Parse the response
    const content = response.choices[0].message.content;
    const result: ProductCategorization = content ? JSON.parse(content) : {
      category: determineBasicCategory(htsCode),
      confidence: 'low',
      keywords: [],
      commonNames: [],
      searchableTerms: description.toLowerCase()
    };
    
    // Cache the result
    apiCache.set(cacheKey, result, 3600 * 24 * 7); // Cache for 7 days
    
    return result;
  } catch (error:any) {
    loga.error(`Error categorizing product: ${error.message}`, error);
    
    // Record error metrics
    const hrDuration = process.hrtime();
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    await recordAIUsage('categorize_product', 0, durationSeconds, false, { htsCode, error: error.message });
    
    // Return basic category on error
    return {
      category: determineBasicCategory(htsCode),
      confidence: 'low',
      keywords: [],
      commonNames: [],
      searchableTerms: description.toLowerCase()
    };
  }
}

/**
 * Determine basic category from HTS code first 2 digits
 */
function determineBasicCategory(htsCode: string): string {
  const chapter = htsCode.substring(0, 2);
  
  // Basic chapter to category mapping
  const chapterMap: Record<string, string> = {
    '01': 'Animals',
    '02': 'Meat',
    '03': 'Fish',
    '04': 'Dairy',
    '05': 'Animal Products',
    '06': 'Plants',
    '07': 'Vegetables',
    '08': 'Fruit',
    '09': 'Coffee & Spices',
    '10': 'Cereals',
    '11': 'Milling Products',
    '12': 'Oil Seeds',
    '13': 'Gums & Resins',
    '15': 'Fats & Oils',
    '16': 'Prepared Food',
    '17': 'Sugar',
    '18': 'Cocoa',
    '19': 'Preparations of Cereals',
    '20': 'Preparations of Vegetables',
    '21': 'Miscellaneous Food',
    '22': 'Beverages',
    '23': 'Food Residues',
    '24': 'Tobacco',
    '25': 'Salt & Stone',
    '26': 'Ores',
    '27': 'Mineral Fuels',
    '28': 'Inorganic Chemicals',
    '29': 'Organic Chemicals',
    '30': 'Pharmaceuticals',
    '31': 'Fertilizers',
    '32': 'Tanning & Dyeing',
    '33': 'Perfumery',
    '34': 'Soap',
    '35': 'Albuminoidal Substances',
    '36': 'Explosives',
    '37': 'Photographic Goods',
    '38': 'Chemical Products',
    '39': 'Plastics',
    '40': 'Rubber',
    '41': 'Raw Hides & Skins',
    '42': 'Leather Articles',
    '43': 'Furskins',
    '44': 'Wood',
    '45': 'Cork',
    '46': 'Straw Products',
    '47': 'Pulp',
    '48': 'Paper',
    '49': 'Printed Books',
    '50': 'Silk',
    '51': 'Wool',
    '52': 'Cotton',
    '53': 'Vegetable Textile Fibers',
    '54': 'Man-made Filaments',
    '55': 'Man-made Staple Fibers',
    '56': 'Wadding',
    '57': 'Carpets',
    '58': 'Special Woven Fabrics',
    '59': 'Coated Textiles',
    '60': 'Knitted Fabrics',
    '61': 'Knitted Apparel',
    '62': 'Woven Apparel',
    '63': 'Textile Articles',
    '64': 'Footwear',
    '65': 'Headgear',
    '66': 'Umbrellas',
    '67': 'Feathers',
    '68': 'Stone Articles',
    '69': 'Ceramics',
    '70': 'Glass',
    '71': 'Precious Stones',
    '72': 'Iron & Steel',
    '73': 'Iron & Steel Articles',
    '74': 'Copper',
    '75': 'Nickel',
    '76': 'Aluminum',
    '78': 'Lead',
    '79': 'Zinc',
    '80': 'Tin',
    '81': 'Base Metals',
    '82': 'Tools',
    '83': 'Metal Articles',
    '84': 'Machinery',
    '85': 'Electrical Machinery',
    '86': 'Railway',
    '87': 'Vehicles',
    '88': 'Aircraft',
    '89': 'Ships',
    '90': 'Optical Instruments',
    '91': 'Clocks',
    '92': 'Musical Instruments',
    '93': 'Arms & Ammunition',
    '94': 'Furniture',
    '95': 'Toys & Sports Equipment',
    '96': 'Miscellaneous',
    '97': 'Art',
    '98': 'Special',
    '99': 'Special'
  };
  
  return chapterMap[chapter] || 'Other';
}

/**
 * Normalize product info for consistent processing
 */
function normalizeProductInfo(product: any): any {
  return {
    id: product.id || 'unknown',
    name: product.name || product.description || 'Unknown Product',
    description: product.description || product.name || 'No description available',
    htsCode: product.htsCode || product.hts_code || 'Unknown',
    category: product.category || determineBasicCategory(product.htsCode || product.hts_code || '0000'),
    baseRate: product.baseRate || product.base_rate || 0
  };
}

/**
 * Normalize country info for consistent processing
 */
function normalizeCountryInfo(country: any): any {
  return {
    id: country.id || 'unknown',
    name: country.name || 'Unknown Country',
    code: country.code || '',
    tradeAgreements: country.tradeAgreements || country.trade_agreements || [],
    specialTariffs: country.specialTariffs || country.special_tariffs || []
  };
}

/**
 * Normalize rate info for consistent processing
 */
function normalizeRateInfo(rate: any, product: any): any {
  // Use product info as fallback
  const baseProduct = normalizeProductInfo(product);
  
  return {
    baseRate: rate.baseRate || rate.base_rate || baseProduct.baseRate || 0,
    additionalRates: rate.additionalRates || rate.additional_rates || [],
    totalRate: rate.totalRate || rate.total_rate || 
      (rate.baseRate || rate.base_rate || baseProduct.baseRate || 0) +
      ((rate.additionalRates || rate.additional_rates || []).reduce(
        (sum: number, r: any) => sum + (parseFloat(r.rate) || 0), 0)),
    effectiveDate: rate.effectiveDate || rate.effective_date || new Date().toISOString()
  };
}
