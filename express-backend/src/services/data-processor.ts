// src/services/data-processor.ts
import { supabase, runQuery, executeTransaction } from '../utils/database';
import logger, { createLogger } from '../utils/logger';
import { metrics } from '../monitoring/metrics-manager';
import { sendAlert } from '../monitoring/alerting-service';
import { apiCache, referenceCache } from '../utils/cache';
import { updateDataFreshness } from '../monitoring/metrics-middleware';
import { explainTariffChange } from './ai-service';
import { notifyProductWatchers } from './notification-service';
import { recordTariffChange } from './tariff-history-service';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

const loga = createLogger('data-processor', logger)

/**
 * Process and store product data from HTS information
 */
export async function processProductData(
    generalRates: any,
    category: string = 'Uncategorized'
  ): Promise<string | null> {
    try {
      loga.info(`Processing product data for HTS code ${generalRates.hts_code}`);
      
      // Check if product already exists
      const { data: existingProduct, error: lookupError } = await supabase
        .from('products')
        .select('id, base_rate')
        .eq('hts_code', generalRates.hts_code)
        .single();
        
      if (lookupError && lookupError.code !== 'PGRST116') {
        throw lookupError;
      }

      // Start timing for metrics
    const startTime = process.hrtime();
    
    // Parse rates and prepare product data
    const baseRate = parseRate(generalRates.rate);
    const specialRates = parseSpecialPrograms(generalRates.special_rates || []);
    
    // Prepare product data
    const productData = {
      hts_code: generalRates.hts_code,
      name: getProductName(generalRates.description),
      description: generalRates.description,
      category: category,
      base_rate: baseRate,
      special_rates: specialRates,
      additional_rates: [],
      unit: generalRates.unit || 'kg',
      last_updated: new Date().toISOString()
    };

    let productId: string | null = null;
    
    if (existingProduct) {
      // Update existing product
      productId = existingProduct.id;
      
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId);
        
      if (updateError) throw updateError;
      
      // Check if base rate changed
      if (existingProduct.base_rate !== baseRate) {
        loga.info(`Base rate changed for ${generalRates.hts_code} from ${existingProduct.base_rate} to ${baseRate}`);
        
        // Record rate change
        // Fix error by passing empty string instead of null for countryId
        await recordTariffChange(
            productId!,
            "", // Empty string instead of null
            {
              baseRate: existingProduct.base_rate,
              additionalRates: [],
              totalRate: existingProduct.base_rate
            },
            {
              baseRate,
              additionalRates: [],
              totalRate: baseRate
            },
            new Date().toISOString(),
            'sync-process'
          );
        }
      }else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
          
        if (insertError) throw insertError;
        
        productId = newProduct.id;
      }
 // Calculate metrics
 const hrDuration = process.hrtime(startTime);
 const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
 
 // Track operation in metrics
 metrics.dbOperationsTotal.inc({ 
   operation: existingProduct ? 'update' : 'insert', 
   table: 'products', 
   status: 'success' 
 });
 
 metrics.dbOperationDuration.observe({ 
   operation: existingProduct ? 'update' : 'insert', 
   table: 'products' 
 }, durationSeconds);
 
 logger.debug(`Product data processed for ${generalRates.hts_code}`);

 // Invalidate any cached data for this product
 const cacheKey = `products:${productId}`;
 apiCache.delete(cacheKey);
 
 return productId;
} catch (error) {
 loga.error(`Error processing product data for HTS code ${generalRates.hts_code}, error as Error`);
 
 // Track operation errors in metrics
 metrics.dbOperationsTotal.inc({ 
   operation: 'upsert', 
   table: 'products', 
   status: 'error' 
 });
 
 throw error;
}
}
/**
 * Process and store additional tariff rates for a product
 */
export async function processAdditionalRates(
    productId: string,
    additionalTariffs: any[]
  ): Promise<void> {
    try {
      loga.info(`Processing additional rates for product ${productId}`);
      
      if (!additionalTariffs || additionalTariffs.length === 0) {
        loga.debug(`No additional tariffs to process for product ${productId}`);
        return;
      }

      // Start timing for metrics
    const startTime = process.hrtime();
    
    // Get current product information
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('additional_rates')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    
    // Format additional rates
    const formattedRates = additionalTariffs.map(tariff => ({
      type: 'section301',
      description: tariff.description,
      rate: parseFloat(tariff.rate.toString()),
      effective_date: tariff.effective_date,
      expiry_date: tariff.expiry_date,
      list_number: tariff.list_number,
      countries: tariff.countries || []
    }));

 // Check if rates have changed
 const currentRates = product.additional_rates || [];
 const hasChanges = JSON.stringify(currentRates) !== JSON.stringify(formattedRates);
 
 if (hasChanges) {
   // Update product with new additional rates
   const { error: updateError } = await supabase
     .from('products')
     .update({
       additional_rates: formattedRates,
       last_updated: new Date().toISOString()
     })
     .eq('id', productId);
     
   if (updateError) throw updateError;
   
   loga.info(`Updated additional rates for product ${productId}`);
   
   // Invalidate any cached data for this product
   const cacheKey = `products:${productId}`;
   apiCache.delete(cacheKey);
 } else {
   loga.debug(`No changes to additional rates for product ${productId}`);
 }
// Calculate metrics
const hrDuration = process.hrtime(startTime);
const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);

// Track operation in metrics
metrics.dbOperationsTotal.inc({ 
  operation: 'update', 
  table: 'products', 
  status: 'success' 
});

metrics.dbOperationDuration.observe({ 
  operation: 'update', 
  table: 'products' 
}, durationSeconds);
} catch (error) {
loga.error(`Error processing additional rates for product ${productId}, error as Error`);

// Track operation errors in metrics
metrics.dbOperationsTotal.inc({ 
  operation: 'update', 
  table: 'products', 
  status: 'error' 
});

throw error;
}
}

/**
 * Process and store exclusions for a product
 */
export async function processExclusions(
  productId: string,
  exclusions: any[]
): Promise<void> {
  try {
    loga.info(`Processing exclusions for product ${productId}`);
    
    if (!exclusions || exclusions.length === 0) {
      loga.debug(`No exclusions to process for product ${productId}`);
      return;
    }
// Start timing for metrics
const startTime = process.hrtime();
    
// Get current exclusions
const { data: currentExclusions, error: exclusionsError } = await supabase
  .from('product_exclusions')
  .select('external_id')
  .eq('product_id', productId);
  
if (exclusionsError) throw exclusionsError;

// Create a map of existing exclusions for quick lookup
const existingExclusionMap = new Map();
currentExclusions?.forEach(ex => {
  existingExclusionMap.set(ex.external_id, true);
});
 // Find new exclusions
 const newExclusions = exclusions.filter(ex => !existingExclusionMap.has(ex.id));
    
 if (newExclusions.length > 0) {
   loga.info(`Found ${newExclusions.length} new exclusions for product ${productId}`);
   
   // Format exclusions for insertion
   const formattedExclusions = newExclusions.map(ex => ({
     product_id: productId,
     external_id: ex.id,
     description: ex.description,
     effective_date: ex.effective_date,
     expiry_date: ex.expiry_date,
     created_at: new Date().toISOString()
   }));
   
   // Insert new exclusions
   const { error: insertError } = await supabase
     .from('product_exclusions')
     .insert(formattedExclusions);
     
   if (insertError) throw insertError;
   // Notify watchers about new exclusions
   await notifyProductWatchers.notifyProductWatchers({
    title: 'New Exclusion Available',
    message: `A new exclusion has been added for this product`,
    type: 'exclusion',
    productId: productId
  });
  
  // Invalidate any cached data for this product
  const cacheKey = `products:${productId}`;
  apiCache.delete(cacheKey);
} else {
  loga.debug(`No new exclusions for product ${productId}`);
}

 // Calculate metrics
 const hrDuration = process.hrtime(startTime);
 const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
 
 // Track operation in metrics
 if (newExclusions.length > 0) {
   metrics.dbOperationsTotal.inc({ 
     operation: 'insert', 
     table: 'product_exclusions', 
     status: 'success' 
   });
   
   metrics.dbOperationDuration.observe({ 
     operation: 'insert', 
     table: 'product_exclusions' 
   }, durationSeconds);
 }
} catch (error) {
 loga.error(`Error processing exclusions for product ${productId}, error as Error`);
 // Track operation errors in metrics
 metrics.dbOperationsTotal.inc({ 
    operation: 'insert', 
    table: 'product_exclusions', 
    status: 'error' 
  });
  
  throw error;
}
}
/**
 * Process and store rulings for a product
 */
export async function processRulings(
    productId: string,
    rulings: any[]
  ): Promise<void> {
    try {
      loga.info(`Processing rulings for product ${productId}`);
      
      if (!rulings || rulings.length === 0) {
        loga.debug(`No rulings to process for product ${productId}`);
        return;
      }
      
      // Start timing for metrics
      const startTime = process.hrtime();
      
      // Get current rulings
      const { data: currentRulings, error: rulingsError } = await supabase
        .from('product_rulings')
        .select('ruling_number')
        .eq('product_id', productId);
        
      if (rulingsError) throw rulingsError;
   // Create a map of existing rulings for quick lookup
   const existingRulingMap = new Map();
   currentRulings?.forEach(ruling => {
     existingRulingMap.set(ruling.ruling_number, true);
   });
   
   // Find new rulings
   const newRulings = rulings.filter(ruling => !existingRulingMap.has(ruling.ruling_number));
   
   if (newRulings.length > 0) {
     loga.info(`Found ${newRulings.length} new rulings for product ${productId}`);
     
     // Format rulings for insertion
     const formattedRulings = newRulings.map(ruling => ({
       product_id: productId,
       ruling_number: ruling.ruling_number,
       title: ruling.title,
       description: ruling.description,
       date: ruling.date,
       url: ruling.url,
       created_at: new Date().toISOString()
     }));

      // Insert new rulings
      const { error: insertError } = await supabase
        .from('product_rulings')
        .insert(formattedRulings);
        
      if (insertError) throw insertError;
      
      // Notify watchers about new rulings
      await notifyProductWatchers.notifyProductWatchers({
        title: 'New Ruling Available',
        message: `A new customs ruling has been issued for this product`,
        type: 'new_ruling',
        productId: productId
      });
      
      // Invalidate any cached data for this product
      const cacheKey = `products:${productId}`;
      apiCache.delete(cacheKey);
    } else {
      loga.debug(`No new rulings for product ${productId}`);
    }
     // Calculate metrics
     const hrDuration = process.hrtime(startTime);
     const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
     
     // Track operation in metrics
     if (newRulings.length > 0) {
       metrics.dbOperationsTotal.inc({ 
         operation: 'insert', 
         table: 'product_rulings', 
         status: 'success' 
       });
       
       metrics.dbOperationDuration.observe({ 
         operation: 'insert', 
         table: 'product_rulings' 
       }, durationSeconds);
     }
   } catch (error) {
     loga.error(`Error processing rulings for product ${productId}, error as Error`);
     
     // Track operation errors in metrics
     metrics.dbOperationsTotal.inc({ 
       operation: 'insert', 
       table: 'product_rulings', 
       status: 'error' 
     });

     throw error;
    }
  }
  
  /**
   * Process and store effective dates for a product
   */
  export async function processEffectiveDates(
    productId: string,
    effectiveDates: any[]
  ): Promise<void> {
    try {
      loga.info(`Processing effective dates for product ${productId}`);
      
      if (!effectiveDates || effectiveDates.length === 0) {
        loga.debug(`No effective dates to process for product ${productId}`);
        return;
      }
 // Start timing for metrics
 const startTime = process.hrtime();
    
 // Get current effective dates
 const { data: currentDates, error: datesError } = await supabase
   .from('product_effective_dates')
   .select('document_number')
   .eq('product_id', productId);
   
 if (datesError) throw datesError;
 
 // Create a map of existing dates for quick lookup
 const existingDateMap = new Map();
 currentDates?.forEach(date => {
   existingDateMap.set(date.document_number, true);
 });
 
 // Find new dates
 const newDates = effectiveDates.filter(date => !existingDateMap.has(date.document_number));
 
 if (newDates.length > 0) {
   loga.info(`Found ${newDates.length} new effective dates for product ${productId}`);
 // Format dates for insertion
 const formattedDates = newDates.map(date => ({
    product_id: productId,
    document_number: date.document_number,
    title: date.title,
    publication_date: date.publication_date,
    effective_date: date.effective_date,
    url: date.html_url,
    created_at: new Date().toISOString()
  }));
  
  // Insert new dates
  const { error: insertError } = await supabase
    .from('product_effective_dates')
    .insert(formattedDates);
    
  if (insertError) throw insertError;
  
  // Invalidate any cached data for this product
  const cacheKey = `products:${productId}`;
  apiCache.delete(cacheKey);
} else {
  loga.debug(`No new effective dates for product ${productId}`);
}


// Calculate metrics
const hrDuration = process.hrtime(startTime);
const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);

// Track operation in metrics
if (newDates.length > 0) {
  metrics.dbOperationsTotal.inc({ 
    operation: 'insert', 
    table: 'product_effective_dates', 
    status: 'success' 
  });
  
  metrics.dbOperationDuration.observe({ 
    operation: 'insert', 
    table: 'product_effective_dates' 
  }, durationSeconds);
}
} catch (error) {
loga.error(`Error processing effective dates for product ${productId}, error as Error`);

// Track operation errors in metrics
metrics.dbOperationsTotal.inc({ 
  operation: 'insert', 
  table: 'product_effective_dates', 
  status: 'error' 
});

throw error;
}
}

/**
* Update total rate for a product based on base and additional rates
*/
export async function updateTotalRate(
productId: string
): Promise<void> {
try {
  loga.info(`Updating total rate for product ${productId}`);
  
  // Start timing for metrics
  const startTime = process.hrtime();
  
  // Get product information
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('base_rate, additional_rates')
    .eq('id', productId)
    .single();
    
  if (productError) throw productError;

  // Calculate total rate
  let totalRate = product.base_rate;
    
  // Add rates from additional tariffs (applied globally)
  if (product.additional_rates && Array.isArray(product.additional_rates)) {
    const globalAdditionalRates = product.additional_rates.filter(
      rate => !rate.countries || rate.countries.length === 0
    );
    
    for (const rate of globalAdditionalRates) {
      totalRate += parseFloat(rate.rate.toString());
    }
  }
  
  // Update product with total rate
  const { error: updateError } = await supabase
    .from('products')
    .update({
      total_rate: totalRate,
      last_updated: new Date().toISOString()
    })
    .eq('id', productId);
    
  if (updateError) throw updateError;
  // Update country-specific rates
  await updateCountrySpecificRates(productId, product);
    
  // Invalidate cache for this product
  const cacheKey = `products:${productId}`;
  apiCache.delete(cacheKey);
  
  // Update data freshness metric
  updateDataFreshness('products', new Date().toISOString());
  
  // Calculate metrics
  const hrDuration = process.hrtime(startTime);
  const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
  
  // Track operation in metrics
  metrics.dbOperationsTotal.inc({ 
    operation: 'update', 
    table: 'products', 
    status: 'success' 
  });
  metrics.dbOperationDuration.observe({ 
    operation: 'update', 
    table: 'products' 
  }, durationSeconds);
  
  loga.debug(`Total rate updated for product ${productId}`);
} catch (error) {
  loga.error(`Error updating total rate for product ${productId}, error as Error`);
  
  // Track operation errors in metrics
  metrics.dbOperationsTotal.inc({ 
    operation: 'update', 
    table: 'products', 
    status: 'error' 
  });
  
  throw error;
}
}

/**
 * Update country-specific rates for a product
 */
async function updateCountrySpecificRates(
    productId: string,
    product: any
  ): Promise<void> {
    try {
      // Get all countries
      const { data: countries, error: countriesError } = await supabase
        .from('countries')
        .select('id, code');
        
      if (countriesError) throw countriesError;

// Group additional rates by country
const countryRates: Record<string, number[]> = {};
    
if (product.additional_rates && Array.isArray(product.additional_rates)) {
  for (const additionalRate of product.additional_rates) {
    if (additionalRate.countries && Array.isArray(additionalRate.countries) && additionalRate.countries.length > 0) {
      for (const countryCode of additionalRate.countries) {
        if (!countryRates[countryCode]) {
          countryRates[countryCode] = [];
        }
        countryRates[countryCode].push(parseFloat(additionalRate.rate.toString()));
      }
    }
  }
}
// Get existing tariff rates for this product
const { data: existingRates, error: ratesError } = await supabase
.from('tariff_rates')
.select('id, country_id, base_rate, total_rate')
.eq('product_id', productId);

if (ratesError) throw ratesError;

// Create a map for quick lookup
const existingRateMap = new Map();
existingRates?.forEach(rate => {
existingRateMap.set(rate.country_id, rate);
});

// Process each country
for (const country of countries) {
// Calculate total rate for this country
let totalRate = product.base_rate;
let additionalRates = [];

// Add country-specific additional rates
if (countryRates[country.code]) {
    for (const rate of countryRates[country.code]) {
      totalRate += rate;
      additionalRates.push({
        type: 'country-specific',
        rate: rate
      });
    }
  }
  
  // Check if rate already exists
  const existingRate = existingRateMap.get(country.id);
  
  if (existingRate) {
    // Check if rate has changed
    if (existingRate.total_rate !== totalRate || existingRate.base_rate !== product.base_rate) {
      // Track the old rate for change history
      const oldRate = {
        baseRate: existingRate.base_rate,
        additionalRates: [],
        totalRate: existingRate.total_rate
      };
      const newRate = {
        baseRate: product.base_rate,
        additionalRates: additionalRates,
        totalRate: totalRate
      };
      
      // Update the rate
      const { error: updateError } = await supabase
        .from('tariff_rates')
        .update({
          base_rate: product.base_rate,
          additional_rates: additionalRates,
          total_rate: totalRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRate.id);
        
      if (updateError) throw updateError;

       // Record the change
       await recordTariffChange(
        productId,
        country.id,
        oldRate,
        newRate,
        new Date().toISOString(),
        'sync-process'
      );
      
      // Generate explanation for significant changes (more than 1%)
      if (Math.abs(existingRate.total_rate - totalRate) >= 1) {
        try {
          // Get the explanation
          const explanation = await explainTariffChange(
            { id: productId },
            { totalRate: existingRate.total_rate },
            { totalRate },
            { id: country.id }
          );
          
          // Notify watchers
          await notifyProductWatchers.notifyProductWatchers({
            title: `Tariff Rate Changed for ${country.code}`,
            message: explanation,
            type: 'rate_change',
            productId,
            countryId: country.id
          });
        } catch (explanationError) {
            loga.error(`Error generating tariff change explanation for ${productId}, ${country.id}, explanationError as Error`);
            // Non-critical error, continue
          }
        }
      }
    } else {
      // Create new rate entry
      const { error: insertError } = await supabase
        .from('tariff_rates')
        .insert({
          id: uuidv4(),
          product_id: productId,
          country_id: country.id,
          base_rate: product.base_rate,
          additional_rates: additionalRates,
          total_rate: totalRate,
          effective_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (insertError) throw insertError;
    }
  }
  
  loga.debug(`Country-specific rates updated for product ${productId}`);
} catch (error) {
  loga.error(`Error updating country-specific rates for product ${productId}, error as Error`);
  throw error;
}
}

/**
* Parse rate from string or number
*/
function parseRate(rate: any): number {
if (typeof rate === 'number') {
  return rate;
}

if (typeof rate === 'string') {
    // Remove any % symbol and convert to number
    const percentMatch = rate.match(/(\d+\.?\d*)%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    // Handle "Free" or "free" text
    if (rate.toLowerCase().includes('free')) {
      return 0;
    }
    
    // Try to extract a number from the string
    const numberMatch = rate.match(/(\d+\.?\d*)/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]);
    }
  }
  
  // Default to 0 if parsing fails
  return 0;
}

/**
 * Parse special program rates
 */
function parseSpecialPrograms(specialRates: any[]): any[] {
    if (!specialRates || !Array.isArray(specialRates)) {
      return [];
    }
    
    return specialRates.map(special => ({
      program: special.program,
      description: getProgramDescription(special.program),
      rate: parseRate(special.rate)
    }));
  }
  
/**
 * Get a cleaner product name from description
 */
function getProductName(description: string): string {
    if (!description) {
      return 'Unknown Product';
    }
    
    // Remove common HTS prefixes/formatting
    let name = description
      .replace(/^--/, '')
      .replace(/^\d+\./, '')
      .replace(/^\s*-+/, '')
      .replace(/^"/, '')
      .replace(/"$/, '')
      .trim();
    
    // Capitalize first letter
    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return name;
  }
  /**
 * Get description for a special program code
 */
function getProgramDescription(code: string): string {
    // Mapping of program codes to descriptions - could be moved to a reference table

    const programDescriptions: Record<string, string> = {
        'A': 'Generalized System of Preferences',
        'AU': 'Australia Free Trade Agreement',
        'BH': 'Bahrain Free Trade Agreement',
        'CA': 'Canada (USMCA/NAFTA)',
        'CL': 'Chile Free Trade Agreement',
        'CO': 'Colombia Trade Promotion Agreement',
        'D': 'African Growth and Opportunity Act',
        'E': 'Caribbean Basin Economic Recovery Act',
        'IL': 'Israel Free Trade Agreement',
        'JO': 'Jordan Free Trade Agreement',
        'KR': 'Korea Free Trade Agreement',
        'MA': 'Morocco Free Trade Agreement',
        'MX': 'Mexico (USMCA/NAFTA)',
        'OM': 'Oman Free Trade Agreement',
        'P': 'Dominican Republic-Central America FTA',
        'PA': 'Panama Trade Promotion Agreement',
        'PE': 'Peru Trade Promotion Agreement',
        'S': 'Singapore Free Trade Agreement',
        'SG': 'Singapore Free Trade Agreement'
      };
      
      return programDescriptions[code] || `Special Program ${code}`;
    }
    
    /**
 * Determine category from HTS code
 */
export function determineCategory(htsCode: string): string {
    // Extract chapter (first two digits)
    const chapter = htsCode.substring(0, 2);

     // Mapping from HTS chapter to category
  const categoryMap: Record<string, string> = {
    '01': 'Live Animals',
    '02': 'Meat',
    '03': 'Fish & Seafood',
    '04': 'Dairy & Eggs',
    '05': 'Animal Products',
    '06': 'Plants & Flowers',
    '07': 'Vegetables',
    '08': 'Fruit & Nuts',
    '09': 'Coffee & Spices',
    '10': 'Cereals',
    '11': 'Milling Products',
    '12': 'Oil Seeds',
    '13': 'Lac & Gums',
    '14': 'Vegetable Materials',
    '15': 'Fats & Oils',
    '16': 'Prepared Meat & Fish',
    '17': 'Sugar',
    '18': 'Cocoa',
    '19': 'Cereal Preparations',
    '20': 'Vegetable Preparations',
    '21': 'Miscellaneous Food',
    '22': 'Beverages',
    '23': 'Food Residues',
    '24': 'Tobacco',
    '25': 'Minerals',
    '26': 'Ores',
    '27': 'Fuels & Oils',
    '28': 'Inorganic Chemicals',
    '29': 'Organic Chemicals',
    '30': 'Pharmaceuticals',
    '31': 'Fertilizers',
    '32': 'Paints & Dyes',
    '33': 'Perfumery & Cosmetics',
    '34': 'Soaps & Detergents',
    '35': 'Proteins & Glues',
    '36': 'Explosives',
    '37': 'Photographic Goods',
    '38': 'Chemical Products',
    '39': 'Plastics',
    '40': 'Rubber',
    '41': 'Leather',
    '42': 'Leather Articles',
    '43': 'Furskins',
    '44': 'Wood',
    '45': 'Cork',
    '46': 'Straw Products',
    '47': 'Pulp',
    '48': 'Paper',
    '49': 'Printed Materials',
    '50': 'Silk',
    '51': 'Wool',
    '52': 'Cotton',
    '53': 'Vegetable Textile Fibers',
    '54': 'Man-made Filaments',
    '55': 'Man-made Staple Fibers',
    '56': 'Wadding & Felt',
    '57': 'Carpets',
    '58': 'Special Fabrics',
    '59': 'Coated Textiles',
    '60': 'Knitted Fabrics',
    '61': 'Knitted Apparel',
    '62': 'Woven Apparel',
    '63': 'Textile Articles',
    '64': 'Footwear',
    '65': 'Headgear',
    '66': 'Umbrellas',
    '67': 'Feathers & Down',
    '68': 'Stone Products',
    '69': 'Ceramics',
    '70': 'Glass',
    '71': 'Precious Stones & Metals',
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
    '85': 'Electrical Equipment',
    '86': 'Railway',
    '87': 'Vehicles',
    '88': 'Aircraft',
    '89': 'Ships',
    '90': 'Optical & Medical Instruments',
    '91': 'Clocks & Watches',
    '92': 'Musical Instruments',
    '93': 'Arms & Ammunition',
    '94': 'Furniture & Bedding',
    '95': 'Toys & Sports Equipment',
    '96': 'Miscellaneous Articles',
    '97': 'Art & Antiques',
    '98': 'Special Classifications',
    '99': 'Temporary Provisions'
  };
 // Return category or default
 return categoryMap[chapter] || 'Miscellaneous';
}

/**
 * Calculate effective tariff rate for a country/product combination
 */
export async function calculateEffectiveRate(
  productId: string,
  countryId: string
): Promise<{ baseRate: number; totalRate: number; additionalRates: any[] }> {
  try {
    // First check if there's a specific tariff rate entry
    const { data: tariffRates, error: tariffError } = await supabase
      .from('tariff_rates')
      .select('*')
      .eq('product_id', productId)
      .eq('country_id', countryId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();


      if (!tariffError && tariffRates) {
        return {
          baseRate: tariffRates.base_rate,
          totalRate: tariffRates.total_rate,
          additionalRates: tariffRates.additional_rates || []
        };
      }
      
      // If no specific rate, get product general rate
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('base_rate, additional_rates')
        .eq('id', productId)
        .single();
        
      if (productError) throw productError;
      
      // Get country info
      const { data: country, error: countryError } = await supabase
        .from('countries')
        .select('code, trade_agreements, special_tariffs')
        .eq('id', countryId)
        .single();
        
      if (countryError) throw countryError;
  
// Start with base rate
let totalRate = product.base_rate;
    
// Filter additional rates for this country
const countryAdditionalRates = [];

if (product.additional_rates && Array.isArray(product.additional_rates)) {
  for (const rate of product.additional_rates) {
    // Add global rates or country-specific ones
    if (!rate.countries || 
        rate.countries.length === 0 || 
        rate.countries.includes(country.code)) {
      totalRate += parseFloat(rate.rate.toString());
      countryAdditionalRates.push(rate);
    }
  }
}
// Apply trade agreement adjustments (simplified - real implementation would be more complex)
if (country.trade_agreements && Array.isArray(country.trade_agreements)) {
    // Check for full duty elimination agreements
    const hasFreeTradeAgreement = country.trade_agreements.some(
      agreement => ['USMCA', 'AU-FTA', 'SG-FTA'].includes(agreement)
    );
    
    if (hasFreeTradeAgreement) {
      totalRate = 0;
    } else {
      // Apply partial reductions based on agreements
      for (const agreement of country.trade_agreements) {
        if (agreement === 'GSP') {
          totalRate *= 0.5; // 50% reduction for GSP countries (simplified)
        }
      }
    }
  }
  return {
    baseRate: product.base_rate,
    totalRate,
    additionalRates: countryAdditionalRates
  };
} catch (error) {
  loga.error(`Error calculating effective rate for product ${productId}, country ${countryId}, error as Error`);
  throw error;
}
}

/**
 * Update compliance requirements for a product
 */
export async function updateComplianceRequirements(
    productId: string,
    requirements: any[]
  ): Promise<void> {
    try {
      loga.info(`Updating compliance requirements for product ${productId}`);
      
      if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
        loga.debug(`No compliance requirements to update for product ${productId}`);
        return;
      }
      
      // Get existing requirements
      const { data: existingRequirements, error: lookupError } = await supabase
        .from('compliance_requirements')
        .select('id, requirement_type, title')
        .eq('product_id', productId);
        
      if (lookupError) throw lookupError;
// Create a map for quick lookup
const existingMap = new Map();
existingRequirements?.forEach(req => {
  // Use type+title as a composite key
  const key = `${req.requirement_type}:${req.title}`;
  existingMap.set(key, req.id);
});

// Process each requirement
for (const requirement of requirements) {
  const key = `${requirement.type}:${requirement.title}`;
  
  if (existingMap.has(key)) {
    // Update existing requirement
    const reqId = existingMap.get(key);
    
    const { error: updateError } = await supabase
      .from('compliance_requirements')
      .update({
        description: requirement.description,
        source: requirement.source,
        url: requirement.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', reqId);
      
    if (updateError) throw updateError;
} else {
    // Create new requirement
    const { error: insertError } = await supabase
      .from('compliance_requirements')
      .insert({
        product_id: productId,
        requirement_type: requirement.type,
        title: requirement.title,
        description: requirement.description,
        source: requirement.source,
        url: requirement.url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) throw insertError;
  }
}

// Invalidate cache for this product
const cacheKey = `products:${productId}`;
apiCache.delete(cacheKey);

loga.debug(`Compliance requirements updated for product ${productId}`);
} catch (error) {
loga.error(`Error updating compliance requirements for product ${productId}, error as Error`);
throw error;
}
}

/**
* Update references to related products
*/
export async function updateRelatedProducts(
productId: string,
relatedHtsCodes: string[]
): Promise<void> {
try {
loga.info(`Updating related products for product ${productId}`);

if (!relatedHtsCodes || !Array.isArray(relatedHtsCodes) || relatedHtsCodes.length === 0) {
  loga.debug(`No related products to update for product ${productId}`);
  return;
}
 // Get existing related products
 const { data: existingRelations, error: lookupError } = await supabase
 .from('related_products')
 .select('related_product_id')
 .eq('product_id', productId);
 
if (lookupError) throw lookupError;

// Get product IDs for the HTS codes
const { data: relatedProducts, error: productsError } = await supabase
 .from('products')
 .select('id, hts_code')
 .in('hts_code', relatedHtsCodes);
 
if (productsError) throw productsError;

// Create a map of existing relations
const existingMap = new Set();
existingRelations?.forEach(rel => {
 existingMap.add(rel.related_product_id);
});
  // Create new relations for products not already related
  for (const related of relatedProducts) {
    if (!existingMap.has(related.id) && related.id !== productId) {
      const { error: insertError } = await supabase
        .from('related_products')
        .insert({
          product_id: productId,
          related_product_id: related.id,
          relationship_type: 'similar', // Default type
          created_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
    }
  }
  
  // Invalidate cache for this product
  const cacheKey = `products:${productId}`;
  apiCache.delete(cacheKey);
  
  loga.debug(`Related products updated for product ${productId}`);
} catch (error) {
  loga.error(`Error updating related products for product ${productId}, error as Error`);
  throw error;
}
}
/**
 * Update product search indices
 */
export async function updateSearchIndices(
    productId: string
  ): Promise<void> {
    try {
      loga.info(`Updating search indices for product ${productId}`);
      
      // Get product information
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, description, hts_code, category, keywords, common_names, searchable_terms')
        .eq('id', productId)
        .single();
        
      if (productError) throw productError;
      
      // Prepare searchable text
      let searchableText = [
        product.name,
        product.description,
        product.hts_code,
        product.category
      ].join(' ');
  // Add keywords and common names
  if (product.keywords && Array.isArray(product.keywords)) {
    searchableText += ' ' + product.keywords.join(' ');
  }
  
  if (product.common_names && Array.isArray(product.common_names)) {
    searchableText += ' ' + product.common_names.join(' ');
  }
  
  // If searchable_terms is already set, include that too
  if (product.searchable_terms) {
    searchableText += ' ' + product.searchable_terms;
  }
  
  // Normalize and clean up text
  const normalizedText = searchableText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();

     // Update the product with the normalized search text
     const { error: updateError } = await supabase
     .from('products')
     .update({
       searchable_terms: normalizedText
     })
     .eq('id', productId);
     
   if (updateError) throw updateError;
   
   loga.debug(`Search indices updated for product ${productId}`);
 } catch (error) {
   loga.error(`Error updating search indices for product ${productId}, error as Error`);
   throw error;
 }
}
/**
 * Bulk update multiple products from array of HTS data
 */
export async function bulkProcessProducts(
    productsData: any[],
    options = { updateIndices: true }
  ): Promise<{ processed: number, errors: number }> {
    const results = {
      processed: 0,
      errors: 0
    };
    
    if (!productsData || !Array.isArray(productsData) || productsData.length === 0) {
      return results;
    }
    
    // Process in batches to avoid overwhelming the database
    const batchSize = config.sync.batchSize;
    
    for (let i = 0; i < productsData.length; i += batchSize) {
      const batch = productsData.slice(i, i + batchSize);
      
      loga.info(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(productsData.length / batchSize)}`);
// Process each item in the batch
for (const item of batch) {
    try {
      // Determine category from HTS code if not provided
      const category = item.category || determineCategory(item.hts_code);
      
      // Process product data
      const productId = await processProductData(item, category);
      
      if (productId) {
        // Update total rate
        await updateTotalRate(productId);
        
        // Update search indices if requested
        if (options.updateIndices) {
          await updateSearchIndices(productId);
        }
        
        results.processed++;
      }
    } catch (error) {
      loga.error(`Error processing product ${item.hts_code}, error as Error`);
      results.errors++;
    }
  }
}
 // Update data freshness metric
 updateDataFreshness('products', new Date().toISOString());
  
 // Report success/failure statistics
 if (results.errors > 0) {
   // Send alert if there were errors
   sendAlert({
     severity: results.errors > (productsData.length / 2) ? 'error' : 'warning',
     title: 'Product Processing Issues',
     message: `Completed processing ${results.processed} products with ${results.errors} errors`,
     component: 'data-processor',
     details: {
       totalItems: productsData.length,
       processedItems: results.processed,
       failedItems: results.errors
     }
   });
 }
 
 return results;
}

/**
 * Match a consumer product to HTS codes
 */
export async function matchConsumerProduct(
    productName: string
  ): Promise<string[]> {
    try {
      // First try exact matches
      const { data: exactMatches, error: exactError } = await supabase
        .from('products')
        .select('hts_code')
        .or(`name.ilike.${productName},common_names.cs.{${productName}}`)
        .limit(5);
        
      if (!exactError && exactMatches && exactMatches.length > 0) {
        return exactMatches.map(match => match.hts_code);
      }
      
      // Try fuzzy matching with searchable terms
      const { data: fuzzyMatches, error: fuzzyError } = await supabase
        .from('products')
        .select('hts_code')
        .textSearch('searchable_terms', productName)
        .limit(10);
        if (!fuzzyError && fuzzyMatches && fuzzyMatches.length > 0) {
            return fuzzyMatches.map(match => match.hts_code);
          }
          
          // Fallback to keyword search
          const words = productName.toLowerCase().split(/\s+/);
          
          const { data: keywordMatches, error: keywordError } = await supabase
            .from('products')
            .select('hts_code')
            .or(words.map(word => `searchable_terms.ilike.%${word}%`).join(','))
            .limit(10);
            
          if (!keywordError && keywordMatches && keywordMatches.length > 0) {
            return keywordMatches.map(match => match.hts_code);
          }
       // No matches found
    return [];
} catch (error) {
  loga.error(`Error matching consumer product: ${productName}, error as Error`);
  return [];
}
}

// Export named functions to avoid ESLint anonymous export warning
const dataProcessor = {
processProductData,
processAdditionalRates,
processExclusions,
processRulings,
processEffectiveDates,
updateTotalRate,
determineCategory,
calculateEffectiveRate,
updateComplianceRequirements,
updateRelatedProducts,
updateSearchIndices,
bulkProcessProducts,
matchConsumerProduct
};

export default dataProcessor;
