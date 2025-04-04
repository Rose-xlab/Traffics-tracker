import { Request, Response, NextFunction } from 'express';
import { metrics } from './metrics-manager';

/**
 * Middleware to collect API metrics
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip metrics collection for monitoring endpoints to avoid circular references
    if (req.path === '/metrics' || req.path === '/health') {
      return next();
    }

    // Record start time
    const startTime = process.hrtime();
    
    // Record request path for metrics
    // Normalize the path to avoid cardinality explosion
    // This replaces dynamic path parts like IDs with placeholders
    const normalizedPath = normalizePath(req.path);
    
    // Capture response data
    const originalSend = res.send;
    res.send = function(body) {
      // Calculate request duration
      const hrDuration = process.hrtime(startTime);
      const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
      
      // Record metrics
      metrics.apiRequestsTotal.inc({ 
        endpoint: normalizedPath, 
        method: req.method, 
        status_code: res.statusCode.toString() 
      });
      
      metrics.apiRequestDuration.observe({ 
        endpoint: normalizedPath, 
        method: req.method 
      }, durationSeconds);
      
      // Call original send
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Normalize API path to prevent high cardinality in metrics
 * e.g. /products/123 -> /products/:id
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/api\/products\/[^\/]+/, '/api/products/:id')
    .replace(/\/api\/countries\/[^\/]+/, '/api/countries/:id')
    .replace(/\/api\/tariffs\/[^\/]+\/[^\/]+/, '/api/tariffs/:productId/:countryId')
    .replace(/\/api\/watchlist\/[^\/]+/, '/api/watchlist/:id')
    .replace(/\/sync\/[^\/]+/, '/sync/:type');
}

/**
 * Middleware for monitoring database operations
 */
export function trackDbOperation<T>(
  operation: string,
  table: string,
  dbFunction: () => Promise<T>
): Promise<T> {
  const startTime = process.hrtime();
  
  return dbFunction()
    .then(result => {
      const hrDuration = process.hrtime(startTime);
      const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
      
      metrics.dbOperationsTotal.inc({ operation, table, status: 'success' });
      metrics.dbOperationDuration.observe({ operation, table }, durationSeconds);
      
      return result;
    })
    .catch(error => {
      metrics.dbOperationsTotal.inc({ operation, table, status: 'error' });
      throw error;
    });
}

/**
 * Update data freshness metrics
 */
export function updateDataFreshness(dataType: string, lastUpdateTimestamp: Date | string): void {
  const lastUpdate = new Date(lastUpdateTimestamp).getTime();
  const now = Date.now();
  const ageHours = (now - lastUpdate) / (1000 * 60 * 60);
  
  metrics.dataFreshness.set({ data_type: dataType }, ageHours);
}