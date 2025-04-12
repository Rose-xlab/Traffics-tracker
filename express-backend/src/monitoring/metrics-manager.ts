import { register, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import logger, { createLogger } from '../utils/logger';

const loga = createLogger('metrics-manager', logger);

// Initialize metrics
export const metrics = {
  // Job metrics
  jobsTotal: new Counter({
    name: 'tariffs_jobs_total',
    help: 'Total number of jobs processed',
    labelNames: ['job_type', 'status'] as const
  }),

  jobDuration: new Histogram({
    name: 'tariffs_job_duration_seconds',
    help: 'Duration of jobs in seconds',
    labelNames: ['job_type'] as const,
    buckets: [10, 30, 60, 300, 600, 1800, 3600, 7200]
  }),

  jobLastSuccess: new Gauge({
    name: 'tariffs_job_last_success_timestamp',
    help: 'Timestamp of last successful job execution',
    labelNames: ['job_type'] as const
  }),

  jobQueueLength: new Gauge({
    name: 'tariffs_job_queue_length',
    help: 'Current length of job queues',
    labelNames: ['queue_name'] as const
  }),

  // API metrics
  apiRequestsTotal: new Counter({
    name: 'tariffs_api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['endpoint', 'method', 'status_code'] as const
  }),

  apiRequestDuration: new Histogram({
    name: 'tariffs_api_request_duration_seconds',
    help: 'Duration of API requests in seconds',
    labelNames: ['endpoint', 'method'] as const,
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
  }),

  // Database metrics
  dbOperationsTotal: new Counter({
    name: 'tariffs_db_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'table', 'status'] as const
  }),

  dbOperationDuration: new Histogram({
    name: 'tariffs_db_operation_duration_seconds',
    help: 'Duration of database operations in seconds',
    labelNames: ['operation', 'table'] as const,
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
  }),

  // Data freshness metrics
  dataFreshness: new Gauge({
    name: 'tariffs_data_freshness_hours',
    help: 'Age of most recent data in hours',
    labelNames: ['data_type'] as const
  }),

  // External API metrics
  externalApiRequestsTotal: new Counter({
    name: 'tariffs_external_api_requests_total',
    help: 'Total number of external API requests',
    labelNames: ['api', 'endpoint', 'status'] as const
  }),

  externalApiRequestDuration: new Histogram({
    name: 'tariffs_external_api_request_duration_seconds',
    help: 'Duration of external API requests in seconds',
    labelNames: ['api', 'endpoint'] as const,
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  }),

  // System metrics
  systemMemoryUsage: new Gauge({
    name: 'tariffs_system_memory_bytes',
    help: 'Memory usage of the process in bytes',
    labelNames: ['type'] as const
  }),

  systemCpuUsage: new Gauge({
    name: 'tariffs_system_cpu_usage',
    help: 'CPU usage percentage',
    labelNames: [] as const
  })
};

/**
 * Initialize metrics collection
 */
export function initializeMetrics() {
  // Enable default metrics (GC, memory, etc.)
  register.setDefaultLabels({
    app: 'tariffs-data-service'
  });

  // Collect default metrics (GC, memory, etc.)
  collectDefaultMetrics({ prefix: 'tariffs_' });

  // Setup periodic system metrics collection
  setupSystemMetricsCollection();

  loga.info('Metrics initialized');
}

/**
 * Update system metrics periodically
 */
function setupSystemMetricsCollection() {
  // Collect memory metrics every 15 seconds
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    
    metrics.systemMemoryUsage.set({ type: 'rss' }, memoryUsage.rss);
    metrics.systemMemoryUsage.set({ type: 'heapTotal' }, memoryUsage.heapTotal);
    metrics.systemMemoryUsage.set({ type: 'heapUsed' }, memoryUsage.heapUsed);
    metrics.systemMemoryUsage.set({ type: 'external' }, memoryUsage.external);
    
    // The CPU usage is more complex to calculate accurately
    // In a production system, you might want a more sophisticated approach
    const cpuUsage = process.cpuUsage();
    const totalCpuTime = cpuUsage.user + cpuUsage.system;
    metrics.systemCpuUsage.set(totalCpuTime / 1000000); // Convert to seconds
  }, 15000);
}

/**
 * Get the metrics registry
 */
export function getMetricsRegistry() {
  return register;
}

/**
 * Get metrics as string
 */
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

/**
 * Clear all metrics (mainly for testing)
 */
export function clearMetrics() {
  register.clear();
}
