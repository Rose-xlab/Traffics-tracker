import axios from 'axios';
import { createLogger } from '../utils/logger';
import { apiCache } from '../utils/cache';
import { usitcRateLimiter } from '../utils/rate-limiter';
import { createCircuitBreaker, createCacheFallback } from '../utils/circuit-breaker';
import { metrics } from '../monitoring/metrics-manager';
import config from '../config';
import { HTSChapter, HTSRate } from './types';

const logger = createLogger('usitc-api');
const CACHE_KEY_PREFIX = 'usitc';
const BASE_URL = config.apis.usitc.baseUrl;

// Create circuit breaker for USITC API
const usitcBreaker = createCircuitBreaker(
  'usitc-api',
  async (endpoint: string, params?: any) => {
    logger.debug(`Making USITC API request to ${endpoint}`);
    
    // Start timing
    const startTime = process.hrtime();
    
    // Make the request
    const response = await axios.get(`${BASE_URL}/${endpoint}`, { params });
    
    // Calculate duration
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record metrics
    metrics.externalApiRequestDuration.observe({ 
      api: 'usitc',
      endpoint
    }, durationSeconds);
    
    return response;
  },
  {
    timeout: 20000,       // 20 second timeout
    errorThresholdPercentage: 40,  // Open at 40% failures
    resetTimeout: 60000   // 1 minute in open state
  }
);

/**
 * Get data for an entire HTS chapter
 */
export async function getHtsChapter(chapter: string): Promise<HTSChapter> {
  const cacheKey = `${CACHE_KEY_PREFIX}:chapter:${chapter}`;
  const cachedData = apiCache.get<HTSChapter>(cacheKey);
  
  if (cachedData) {
    logger.debug(`Cache hit for HTS chapter ${chapter}`);
    return cachedData;
  }

  try {
    logger.info(`Fetching HTS chapter ${chapter}`);
    
    // Apply rate limiting
    await usitcRateLimiter.throttle('chapter');
    
    // Create fallback function for circuit breaker
    const fallback = createCacheFallback(cacheKey, {
      chapter,
      description: 'Cached fallback chapter data',
      sections: []
    });
    
    // Use circuit breaker
    const response = await usitcBreaker.fire(
      `chapters/${chapter}`,
      undefined,
      fallback
    );
    
    if (!response || response.status !== 200) {
      throw new Error(`Failed to fetch HTS chapter ${chapter}: Status ${response?.status || 'unknown'}`);
    }
    
    // Process and validate the response data
    const data = validateHtsChapter(response.data);
    
    // Cache the result
    apiCache.set(cacheKey, data, 3600); // Cache for 1 hour
    return data;
  } catch (error) {
    logger.error(`Error fetching HTS chapter ${chapter}`, error as Error);
    throw error;
  }
}

/**
 * Search for HTS codes by query
 */
export async function searchHtsCodes(query: string): Promise<HTSRate[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}:search:${query}`;
  const cachedData = apiCache.get<HTSRate[]>(cacheKey);
  
  if (cachedData) {
    logger.debug(`Cache hit for HTS search "${query}"`);
    return cachedData;
  }

  try {
    logger.info(`Searching HTS codes for "${query}"`);
    
    // Apply rate limiting
    await usitcRateLimiter.throttle('search');
    
    // Create fallback function for circuit breaker
    const fallback = createCacheFallback(cacheKey, []);
    
    // Use circuit breaker
    const response = await usitcBreaker.fire(
      `search`,
      { q: query },
      fallback
    );
    
    if (!response || response.status !== 200) {
      throw new Error(`Failed to search HTS codes: Status ${response?.status || 'unknown'}`);
    }
    
    // Process and validate the response
    const data = Array.isArray(response.data) ? response.data : [];
    
    // Cache the result
    apiCache.set(cacheKey, data, 1800); // Cache for 30 minutes
    return data;
  } catch (error) {
    logger.error(`Error searching HTS codes for "${query}"`, error as Error);
    throw error;
  }
}

/**
 * Get rates for a specific HTS code
 */
export async function getGeneralRates(htsCode: string): Promise<HTSRate> {
  const cacheKey = `${CACHE_KEY_PREFIX}:rates:${htsCode}`;
  const cachedData = apiCache.get<HTSRate>(cacheKey);
  
  if (cachedData) {
    logger.debug(`Cache hit for HTS rates ${htsCode}`);
    return cachedData;
  }

  try {
    logger.info(`Fetching rates for HTS code ${htsCode}`);
    
    // Apply rate limiting
    await usitcRateLimiter.throttle('rates');
    
    // Create fallback function for circuit breaker
    const fallback = createCacheFallback(cacheKey, {
      hts_code: htsCode,
      description: 'Fallback rate data',
      rate: 0,
      unit: 'ad_valorem'
    });
    
    // Use circuit breaker
    const response = await usitcBreaker.fire(
      `rates/${htsCode}`,
      undefined,
      fallback
    );
    
    if (!response || response.status !== 200) {
      throw new Error(`Failed to fetch rates for HTS code ${htsCode}: Status ${response?.status || 'unknown'}`);
    }
    
    // Cache the result
    apiCache.set(cacheKey, response.data, 3600); // Cache for 1 hour
    return response.data;
  } catch (error) {
    logger.error(`Error fetching rates for HTS code ${htsCode}`, error as Error);
    throw error;
  }
}

/**
 * Validate HTS chapter data structure
 */
function validateHtsChapter(data: any): HTSChapter {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid HTS chapter data format');
  }
  
  if (!data.chapter || !data.description || !Array.isArray(data.sections)) {
    throw new Error('Missing required fields in HTS chapter data');
  }
  
  return {
    chapter: data.chapter,
    description: data.description,
    sections: data.sections.map((section: any) => ({
      code: section.code || '',
      description: section.description || '',
      rates: Array.isArray(section.rates) ? section.rates : []
    }))
  };
}