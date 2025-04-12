import { Router } from 'express';
import logger, { createLogger } from '../utils/logger';
import { supabase } from '../utils/database';
import { apiCache, cache, referenceCache } from '../utils/cache';
import { metrics } from '../monitoring/metrics-manager';
import { getCircuitBreakers } from '../utils/circuit-breaker';
 import { 
productSyncQueue, 
tariffSyncQueue, 
  updateSyncQueue,
  cleanupQueue 
} from '../queue/job-queues';

const router = Router();
const loga = createLogger('status-routes',logger);

/**
 * Authentication middleware for secure routes
 */
function requireAuth(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  
  // Simple API key check
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}
/**
 * Get job queue statuses
 */
router.get('/queues', requireAuth, async (req, res) => {
  try {
    // Get counts from each queue
    const [
      productSyncCounts,
      tariffSyncCounts,
      updateSyncCounts,
      cleanupCounts
    ] = await Promise.all([
      productSyncQueue.getJobCounts(),
      tariffSyncQueue.getJobCounts(),
      updateSyncQueue.getJobCounts(),
      cleanupQueue.getJobCounts()
    ]);
    
    // Get active jobs
    const [
      productActiveJobs,
      tariffActiveJobs,
      updateActiveJobs,
      cleanupActiveJobs
    ] = await Promise.all([
      productSyncQueue.getActive(),
      tariffSyncQueue.getActive(),
      updateSyncQueue.getActive(),
      cleanupQueue.getActive()
    ]);
    
    // Get repeated job state
    const repeatedJobs = await Promise.all([
      productSyncQueue.getRepeatableJobs(),
      tariffSyncQueue.getRepeatableJobs(),
      updateSyncQueue.getRepeatableJobs(),
      cleanupQueue.getRepeatableJobs()
    ]);
    
    res.json({
      data: {
        queues: {
          'product-sync': {
            counts: productSyncCounts,
            active: productActiveJobs.map(job => ({
              id: job.id,
              name: job.name,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              data: job.data
            })),
            repeated: repeatedJobs[0]
          },
          'tariff-sync': {
            counts: tariffSyncCounts,
            active: tariffActiveJobs.map(job => ({
              id: job.id,
              name: job.name,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              data: job.data
            })),
            repeated: repeatedJobs[1]
          },
          'update-sync': {
            counts: updateSyncCounts,
            active: updateActiveJobs.map(job => ({
              id: job.id,
              name: job.name,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              data: job.data
            })),
            repeated: repeatedJobs[2]
          },
          'cleanup': {
            counts: cleanupCounts,
            active: cleanupActiveJobs.map(job => ({
              id: job.id,
              name: job.name,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              data: job.data
            })),
            repeated: repeatedJobs[3]
          }
        }
      }
    });
  } catch (error) {
    loga.error('Error fetching queue status', error as Error);
    res.status(500).json({
      error: 'Failed to fetch queue status',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Get sync job status
 */
router.get('/sync', requireAuth, async (req, res) => {
  try {
    const jobType = req.query.type as string;
    
    let query = supabase
      .from('sync_status')
      .select('*')
      .order('started_at', { ascending: false });
      
    if (jobType) {
      query = query.eq('type', jobType);
    }
    
    const { data, error } = await query.limit(10);
      
    if (error) throw error;
    
    res.json({ data });
  } catch (error) {
    loga.error('Error fetching sync status', error as Error);
    res.status(500).json({
      error: 'Failed to fetch sync status',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Get circuit breaker statuses
 */
router.get('/circuits', requireAuth, async (req, res) => {
  try {
    const breakers = getCircuitBreakers();
    const circuitStatus = Object.entries(breakers).map(([name, breaker]) => ({
      name,
      state: breaker
      // stats: {
      //   successes: breaker.stats.successes,
      //   failures: breaker.stats.failures,
      //   rejects: breaker.stats.rejects,
      //   timeouts: breaker.stats.timeouts,
      //   fallbacks: breaker.stats.fallbacks,
      //   latencyMean: breaker.stats.latencyMean
      // },
      // options: {
      //   timeout: breaker.options.timeout,
      //   errorThreshold: breaker.options.errorThresholdPercentage,
      //   resetTimeout: breaker.options.resetTimeout
      // }
    }));
    
    res.json({ data: circuitStatus });
  } catch (error) {
    loga.error('Error fetching circuit breaker status', error as Error);
    res.status(500).json({
      error: 'Failed to fetch circuit breaker status',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Get cache statistics
 */
router.get('/cache', requireAuth, async (req, res) => {
  try {
    const stats = {
      apiCache: apiCache.stats(),
      generalCache: cache.stats(),
      referenceCache: referenceCache.stats()
    };
    
    res.json({ data: stats });
  } catch (error) {
    loga.error('Error fetching cache stats', error as Error);
    res.status(500).json({
      error: 'Failed to fetch cache stats',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Clear cache
 */
router.post('/cache/clear', requireAuth, async (req, res) => {
  try {
    const cacheType = req.query.type as string;
    
    if (cacheType === 'api') {
      apiCache.flush();
    } else if (cacheType === 'general') {
      cache.flush();
    } else if (cacheType === 'reference') {
      referenceCache.flush();
    } else {
      // Clear all caches
      apiCache.flush();
      cache.flush();
      referenceCache.flush();
    }
    
    res.json({
      message: `Cache${cacheType ? ` (${cacheType})` : ''} cleared successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loga.error('Error clearing cache', error as Error);
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Get database statistics
 */
router.get('/database', requireAuth, async (req, res) => {
  try {
    // Get table counts
    const [
      productsCount,
      tariffRatesCount,
      tradeUpdatesCount,
      notificationsCount,
      analyticsEventsCount
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('tariff_rates').select('*', { count: 'exact', head: true }),
      supabase.from('trade_updates').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_events').select('*', { count: 'exact', head: true })
    ]);
    
    // Get latest update timestamp for each table
    const [
      latestProduct,
      latestTariffRate,
      latestTradeUpdate
    ] = await Promise.all([
      supabase.from('products').select('last_updated').order('last_updated', { ascending: false }).limit(1).single(),
      supabase.from('tariff_rates').select('updated_at').order('updated_at', { ascending: false }).limit(1).single(),
      supabase.from('trade_updates').select('updated_at').order('updated_at', { ascending: false }).limit(1).single()
    ]);
    
    res.json({
      data: {
        counts: {
          products: productsCount.count,
          tariffRates: tariffRatesCount.count,
          tradeUpdates: tradeUpdatesCount.count,
          notifications: notificationsCount.count,
          analyticsEvents: analyticsEventsCount.count
        },
        latestUpdates: {
          products: latestProduct?.data?.last_updated || null,
          tariffRates: latestTariffRate?.data?.updated_at || null,
          tradeUpdates: latestTradeUpdate?.data?.updated_at || null
        }
      }
    });
  } catch (error) {
    loga.error('Error fetching database stats', error as Error);
    res.status(500).json({
      error: 'Failed to fetch database stats',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Get system metrics
 */
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    
    res.json({
      data: {
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external)
        },
        uptime: formatUptime(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    loga.error('Error fetching system metrics', error as Error);
    res.status(500).json({
      error: 'Failed to fetch system metrics',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime to human-readable string
 */
function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

export default router;