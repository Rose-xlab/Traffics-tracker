import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { createLogger } from '../utils/logger';
import { getHtsChapter } from '../api/usitc';
import { aggregateProductData, findProductsToUpdate } from '../services/data-aggregator';
import { supabase } from '../utils/database';
import { metrics } from '../monitoring/metrics-manager';
import { sendAlert } from '../monitoring/alerting-service';
import { updateDataFreshness } from '../monitoring/metrics-middleware';
import config from '../config';

const logger = createLogger('sync-products');

/**
 * Sync all products or update existing ones
 */
export async function syncProducts(fullSync: boolean = false): Promise<void> {
  const queue = new PQueue({ concurrency: config.sync.concurrency });
  
  try {
    logger.info(`Starting product sync (full sync: ${fullSync})`);
    
    // Start timing for metrics
    const startTime = process.hrtime();
    
    // Create sync status record
    const { data: syncRecord, error: syncError } = await supabase
      .from('sync_status')
      .insert({
        type: 'products',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (syncError) {
      logger.error('Failed to create sync status record', syncError);
    }
    
    const syncId = syncRecord?.id;
    
    // Track sync job start in metrics
    metrics.jobsTotal.inc({ job_type: 'product-sync', status: 'started' });
    
    if (fullSync) {
      // Perform full sync of all HTS chapters
      await fullProductSync(queue);
    } else {
      // Update only products that need updating
      await incrementalProductSync(queue);
    }
    
    // Update sync status
    if (syncId) {
      await supabase
        .from('sync_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', syncId);
    }
    
    // Get latest product timestamp for data freshness metrics
    const { data: latestProduct } = await supabase
      .from('products')
      .select('last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
      
    if (latestProduct?.last_updated) {
      updateDataFreshness('products', latestProduct.last_updated);
    }
    
    // Calculate duration for metrics
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record metrics
    metrics.jobDuration.observe({ job_type: 'product-sync' }, durationSeconds);
    metrics.jobsTotal.inc({ job_type: 'product-sync', status: 'completed' });
    metrics.jobLastSuccess.set({ job_type: 'product-sync' }, Date.now() / 1000);
    
    logger.info(`Product sync completed successfully in ${durationSeconds.toFixed(2)} seconds`);
    
    // Send success alert
    sendAlert({
      severity: 'info',
      title: 'Product Sync Completed',
      message: `Product sync (${fullSync ? 'full' : 'incremental'}) completed successfully in ${durationSeconds.toFixed(2)} seconds`,
      component: 'sync-jobs'
    });
  } catch (error) {
    logger.error('Error during product sync', error as Error);
    
    // Record failure metrics
    metrics.jobsTotal.inc({ job_type: 'product-sync', status: 'failed' });
    
    // Send alert on failure
    sendAlert({
      severity: 'error',
      title: 'Product Sync Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      component: 'sync-jobs',
      details: {
        fullSync,
        error: error instanceof Error ? error.stack : 'Unknown error'
      }
    });
    
    // Update sync status on error
    await supabase
      .from('sync_status')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('type', 'products')
      .is('completed_at', null);
      
    throw error;
  }
}

/**
 * Perform full sync of all HTS chapters
 */
async function fullProductSync(queue: PQueue): Promise<void> {
  logger.info('Starting full product sync');
  
  let processedChapters = 0;
  let totalChapters = 99; // 1-99 chapters
  
  // Process all HTS chapters (1-99)
  for (let chapter = 1; chapter <= 99; chapter++) {
    const chapterStr = chapter.toString().padStart(2, '0');
    
    queue.add(() => 
      pRetry(
        async () => {
          logger.info(`Processing HTS chapter ${chapterStr}`);
          
          try {
            const chapterData = await getHtsChapter(chapterStr);
            
            // Process each section and rate in the chapter
            for (const section of chapterData.sections) {
              for (const rate of section.rates) {
                await aggregateProductData(
                  rate.hts_code,
                  section.description
                );
              }
            }
            
            // Update progress metrics
            processedChapters++;
            metrics.jobQueueLength.set({ queue_name: 'product-sync' }, queue.size);
            
            logger.info(`Completed processing HTS chapter ${chapterStr} (${processedChapters}/${totalChapters})`);
          } catch (error) {
            logger.error(`Error processing HTS chapter ${chapterStr}`, error as Error);
            throw error;
          }
        },
        { 
          retries: config.sync.retries,
          onFailedAttempt: (error) => {
            logger.warn(`Attempt failed for chapter ${chapterStr}: ${error.message}, retrying...`);
          }
        }
      )
    );
  }
  
  // Wait for all queue items to complete
  await queue.onIdle();
  logger.info('Full product sync completed');
}

/**
 * Update only products that need updating
 */
async function incrementalProductSync(queue: PQueue): Promise<void> {
  logger.info('Starting incremental product sync');
  
  // Find products that need updating
  const htsCodes = await findProductsToUpdate(config.sync.batchSize);
  
  if (htsCodes.length === 0) {
    logger.info('No products need updating');
    return;
  }
  
  logger.info(`Found ${htsCodes.length} products to update`);
  
  // Get product categories
  const { data: products, error } = await supabase
    .from('products')
    .select('hts_code, category')
    .in('hts_code', htsCodes);
    
  if (error) {
    throw error;
  }
  
  // Create a lookup map for categories
  const categoryMap = new Map<string, string>();
  for (const product of products) {
    categoryMap.set(product.hts_code, product.category);
  }
  
  let processedProducts = 0;
  const totalProducts = htsCodes.length;
  
  // Update each product
  for (const htsCode of htsCodes) {
    const category = categoryMap.get(htsCode) || 'Uncategorized';
    
    queue.add(() => 
      pRetry(
        async () => {
          try {
            await aggregateProductData(htsCode, category);
            
            // Update progress
            processedProducts++;
            metrics.jobQueueLength.set({ queue_name: 'product-sync' }, queue.size);
            
            logger.debug(`Updated product ${htsCode} (${processedProducts}/${totalProducts})`);
          } catch (error) {
            logger.error(`Error updating product ${htsCode}`, error as Error);
            throw error;
          }
        },
        { 
          retries: config.sync.retries,
          onFailedAttempt: (error) => {
            logger.warn(`Attempt failed for product ${htsCode}: ${error.message}, retrying...`);
          }
        }
      )
    );
  }
  
  // Wait for all queue items to complete
  await queue.onIdle();
  logger.info(`Incremental product sync completed, updated ${processedProducts} products`);
}