import * as Opossum from 'opossum';
import { createLogger } from './logger';
import { metrics } from '../monitoring/metrics-manager';
import { sendAlert } from '../monitoring/alerting-service';
import { apiCache } from './cache';

const logger = createLogger('circuit-breaker');

// Default circuit breaker options
const defaultOptions: Opossum.Options = {
  failureThreshold: 50,        // Open after 50% of requests fail
  resetTimeout: 30000,         // 30 seconds in open state before testing again
  timeout: 15000,              // 15 second request timeout
  errorThresholdPercentage: 50,// Error threshold percentage
  rollingCountTimeout: 60000,  // 1 minute rolling window
  rollingCountBuckets: 10,     // 10 buckets in the rolling window
  name: 'default'              // Default name
};

// Circuit breakers registry
const breakers: Record<string, Opossum.CircuitBreaker<any>> = {};

// Interface for API request functions
interface ApiRequestFunction<T> {
  (...args: any[]): Promise<T>;
}

/**
 * Create a circuit breaker for an API
 */
export function createCircuitBreaker<T>(
  name: string,
  requestFn: ApiRequestFunction<T>,
  options: Partial<Opossum.Options> = {}
): Opossum.CircuitBreaker<T> {
  if (breakers[name]) {
    return breakers[name];
  }

  const circuitOptions: Opossum.Options = {
    ...defaultOptions,
    ...options,
    name
  };

  logger.info(`Creating circuit breaker: ${name}`);
  
  // Create the circuit breaker
  const breaker = new Opossum(requestFn, circuitOptions);
  
  // Set up event handlers
  setupCircuitEvents(breaker, name);
  
  // Store in registry
  breakers[name] = breaker;
  
  return breaker;
}

/**
 * Set up event handlers for circuit breaker
 */
function setupCircuitEvents(
  breaker: Opossum.CircuitBreaker<any>,
  name: string
): void {
  // Fire when the circuit opens
  breaker.on('open', () => {
    logger.warn(`Circuit ${name} is open`);
    
    // Record metric
    metrics.externalApiRequestsTotal.inc({ 
      api: name,
      endpoint: 'all',
      status: 'circuit_open'
    });
    
    // Send alert
    sendAlert({
      severity: 'warning',
      title: 'Circuit Breaker Open',
      message: `Circuit breaker for ${name} API is open due to high failure rate`,
      component: 'external-api',
      details: {
        api: name,
        metrics: breaker.stats
      }
    });
  });
  
  // Fire when the circuit closes
  breaker.on('close', () => {
    logger.info(`Circuit ${name} is closed`);
    
    // Send alert for recovery
    sendAlert({
      severity: 'info',
      title: 'Circuit Breaker Closed',
      message: `Circuit breaker for ${name} API has closed and is operating normally`,
      component: 'external-api'
    });
  });
  
  // Fire when the circuit is half-open
  breaker.on('halfOpen', () => {
    logger.info(`Circuit ${name} is half-open, testing the waters`);
  });
  
  // Fire on a successful request when the circuit is closed
  breaker.on('success', (result) => {
    metrics.externalApiRequestsTotal.inc({ 
      api: name,
      endpoint: getEndpointFromResult(result),
      status: 'success'
    });
  });
  
  // Fire on a failed request
  breaker.on('failure', (error) => {
    logger.error(`Circuit ${name} request failed:`, error);
    
    metrics.externalApiRequestsTotal.inc({ 
      api: name,
      endpoint: 'unknown', // It's hard to determine the endpoint on failure
      status: 'failure'
    });
  });
  
  // Fire on a timeout
  breaker.on('timeout', (error) => {
    logger.warn(`Circuit ${name} request timed out:`, error);
    
    metrics.externalApiRequestsTotal.inc({ 
      api: name,
      endpoint: 'unknown',
      status: 'timeout'
    });
  });
  
  // Fire when a fallback is executed
  breaker.on('fallback', (result) => {
    logger.info(`Circuit ${name} executed fallback`);
  });
  
  // Fire when the circuit rejects a request due to being open
  breaker.on('reject', () => {
    logger.warn(`Circuit ${name} rejected request because it is open`);
    
    metrics.externalApiRequestsTotal.inc({ 
      api: name,
      endpoint: 'all',
      status: 'rejected'
    });
  });
}

/**
 * Try to extract endpoint from the result
 */
function getEndpointFromResult(result: any): string {
  if (!result) return 'unknown';
  
  // This is a very simplified implementation
  // In a real system, you might use request interceptors to capture this info
  if (result.config && result.config.url) {
    const url = new URL(result.config.url);
    return url.pathname;
  }
  
  return 'unknown';
}

/**
 * Create a fallback function that returns cached data
 */
export function createCacheFallback<T>(
  cacheKey: string,
  defaultValue: T
): () => T {
  return () => {
    const cachedValue = apiCache.get<T>(cacheKey);
    if (cachedValue) {
      logger.info(`Using cached value for ${cacheKey}`);
      return cachedValue;
    }
    
    logger.warn(`No cached value for ${cacheKey}, using default`);
    return defaultValue;
  };
}

/**
 * Get all circuit breakers
 */
export function getCircuitBreakers(): Record<string, Opossum.CircuitBreaker<any>> {
  return { ...breakers };
}