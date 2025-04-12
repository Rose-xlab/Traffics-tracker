// express-backend/src/queue/job-queues.ts
import Queue from 'bull';
import logger, { createLogger } from '../utils/logger';
import config from '../config';
import { syncProducts } from '../jobs/sync-products';
import { syncTariffs } from '../jobs/sync-tariffs';
import { syncUpdates } from '../jobs/sync-updates';
import { cleanupJob } from '../jobs/cleanup';

const loga = createLogger('job-queues',logger);

// Redis configuration from config
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  prefix: config.redis.prefix
};

// Queue definitions
export const productSyncQueue = new Queue('product-sync', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  });
  
  export const tariffSyncQueue = new Queue('tariff-sync', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  });
 
  export const updateSyncQueue = new Queue('update-sync', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  });
  
  export const cleanupQueue = new Queue('cleanup', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 20,
      removeOnFail: 20
    }
  });
  
  // Adding HTS data sync queue
export const htsSyncQueue = new Queue('hts-sync', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 10,
      removeOnFail: 10
    }
  });
  
  // Job processors
  export function initializeJobProcessors() {
    // Product sync processor
    productSyncQueue.process(async (job) => {
      loga.info("Processing product sync job ${job.id}");
      const fullSync = job.data.fullSync === true;
      await syncProducts(fullSync);
      return { success: true };
    });

    // Tariff sync processor
  tariffSyncQueue.process(async (job) => {
  loga.info("Processing tariff sync job ${job.id}");
    await syncTariffs();
    return { success: true };
  });

  // Update sync processor
  updateSyncQueue.process(async (job) => {
    loga.info(`Processing update sync job ${job.id}`);
    await syncUpdates();
    return { success: true };
  });

  // Cleanup processor
  cleanupQueue.process(async (job) => {
    loga.info(`Processing cleanup job ${job.id}`);
    await cleanupJob();
    return { success: true };
  });

  // HTS sync processor
  htsSyncQueue.process(async (job) => {
    loga.info(`Processing HTS sync job ${job.id}`)
    
    // This would be implemented in a new file like jobs/sync-hts.ts
    // We'll import it when we create that file
    const { syncHtsData } = require('../jobs/sync-hts');
    await syncHtsData(job.data);
    
    return { success: true };
  });

   // Set up error handlers
   const queues = [productSyncQueue, tariffSyncQueue, updateSyncQueue, cleanupQueue, htsSyncQueue];
  
   queues.forEach(queue => {
     queue.on('error', (error) => {
       loga.error(`Error in ${queue.name} queue:`, error);
     });
 
     queue.on('failed', (job, error) => {
       loga.error(`Job ${job.id} in ${queue.name} queue failed:`, error);
     });
 
     queue.on('completed', (job) => {
       loga.info(`Job ${job.id} in ${queue.name} queue completed successfully`);
     });
   });
 
   loga.info('Job processors initialized successfully');
 }

 // Schedule recurring jobs
export function scheduleRecurringJobs() {
    // Product sync - run daily at 1:00 AM
    productSyncQueue.add({ fullSync: false }, { repeat: { cron: '0 1 * * *' } });
    
    // Tariff sync - run daily at 2:00 AM
    tariffSyncQueue.add({}, { repeat: { cron: '0 2 * * *' } });
    
    // Update sync - run every 4 hours
    updateSyncQueue.add({}, { repeat: { cron: '0 */4 * * *' } });
    
    // Cleanup - run daily at 3:00 AM
    cleanupQueue.add({}, { repeat: { cron: '0 3 * * *' } });
    
    // HTS sync - run weekly on Sunday at 4:00 AM
    htsSyncQueue.add({}, { repeat: { cron: '0 4 * * 0' } });
  
    loga.info('Recurring jobs scheduled');
  }
  
  // Add a one-time job
  export async function addOneTimeJob(queue: Queue.Queue, data: any = {}) {
    const job = await queue.add(data);
  loga.info(`Added one-time job ${job.id} to ${queue.name} queue`);
    return job;
  }
  
  // Stop all jobs
export function stopAllJobs() {
    const queues = [productSyncQueue, tariffSyncQueue, updateSyncQueue, cleanupQueue, htsSyncQueue];
    
    for (const queue of queues) {
      queue.pause();
    }
    
    loga.info('All job queues paused');
  }
  
  // Close queue connections
  export async function closeJobQueues() {
    const queues = [productSyncQueue, tariffSyncQueue, updateSyncQueue, cleanupQueue, htsSyncQueue];
    
    for (const queue of queues) {
      await queue.close();
    }
    
    loga.info('All job queues closed');
  }
 