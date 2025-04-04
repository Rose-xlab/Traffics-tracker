import Queue, { QueueOptions } from 'bull';
import { createLogger } from '../utils/logger';

const logger = createLogger('queue-factory');

// Redis configuration from environment variables
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  prefix: process.env.REDIS_PREFIX || 'tariffs_tracker:'
};

// Default queue options
const defaultOptions: QueueOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000  // 5 seconds initial delay, then 10s, 20s, etc.
    },
    removeOnComplete: 100,  // Keep last 100 completed jobs
    removeOnFail: 50        // Keep last 50 failed jobs
  }
};

// Queue instances cache
const queues: Record<string, Queue.Queue> = {};

/**
 * Create or get a Bull queue instance
 * @param name Queue name
 * @param options Optional queue options
 */
export function createQueue(name: string, options?: Partial<QueueOptions>): Queue.Queue {
  if (queues[name]) {
    return queues[name];
  }

  const queueOptions = {
    ...defaultOptions,
    ...options
  };

  logger.info(`Creating queue: ${name}`);
  const queue = new Queue(name, queueOptions);

  // Set up event handlers
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} in queue ${name} failed:`, error);
  });

  queue.on('stalled', (jobId) => {
    logger.warn(`Job ${jobId} in queue ${name} is stalled`);
  });

  // Store in cache
  queues[name] = queue;
  return queue;
}

/**
 * Get all registered queues
 */
export function getQueues(): Queue.Queue[] {
  return Object.values(queues);
}

/**
 * Close all queue connections
 */
export async function closeQueues(): Promise<void> {
  const closePromises = Object.values(queues).map(queue => queue.close());
  await Promise.all(closePromises);
  logger.info('All queues closed');
}