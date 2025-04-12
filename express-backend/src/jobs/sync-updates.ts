import logger, { createLogger } from '../utils/logger';
import { getTariffNotices } from '../api/federal-register';
import { processTradeUpdates } from '../services/data-aggregator';
// import { notifyAboutTradeUpdates } from '../services/notification-service';
import { notifyProductWatchers } from '../services/notification-service';
import { supabase } from '../utils/database';

const loga = createLogger('sync-updates', logger);

/**
 * Sync trade updates from Federal Register
 */
export async function syncUpdates(): Promise<void> {
  try {
    loga.info('Starting trade updates sync');
    
    // Create sync status record
    const { data: syncRecord, error: syncError } = await supabase
      .from('sync_status')
      .insert({
        type: 'updates',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (syncError) {
      loga.error('Failed to create sync status record', syncError);
    }
    
    const syncId = syncRecord?.id;
    
    // Get existing updates
    const { data: existingUpdates, error: existingError } = await supabase
      .from('trade_updates')
      .select('source_reference')
      .order('published_date', { ascending: false })
      .limit(100);
      
    if (existingError) throw existingError;
    
    // Get latest notices
    const notices = await getTariffNotices();
    
    // Filter out notices that are already processed
    const existingRefs = new Set(existingUpdates.map(u => u.source_reference));
    const newNotices = notices.filter(notice => !existingRefs.has(notice.document_number));
    
    loga.info(`Found ${newNotices.length} new trade updates`);
    
    if (newNotices.length > 0) {
      // Process new notices
      for (const notice of newNotices) {
        // Determine impact level
        const impact = determineImpactLevel(notice);
        
        // Create update record
        const { data: update, error } = await supabase
          .from('trade_updates')
          .insert({
            title: notice.title,
            description: notice.abstract,
            impact,
            source_url: notice.html_url,
            source_reference: notice.document_number,
            published_date: notice.publication_date
          })
          .select('id')
          .single();
          
        if (error) throw error;
        
        // Notify relevant users
        if (update) {
          await notifyProductWatchers.notifyAboutTradeUpdates(update.id);
        }
        
        loga.info(`Processed trade update: ${notice.document_number}`);
      }
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
    
    loga.info('Trade updates sync completed successfully');
  } catch (error) {
    loga.error('Error during trade updates sync', error as Error);
    
    // Update sync status on error
    await supabase
      .from('sync_status')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('type', 'updates')
      .is('completed_at', null);
      
    throw error;
  }
}

/**
 * Determine impact level of a notice
 */
function determineImpactLevel(notice: any): 'low' | 'medium' | 'high' {
  const content = (notice.title + ' ' + notice.abstract).toLowerCase();
  
  // Check for high impact keywords
  if (
    content.includes('immediate effect') || 
    content.includes('significant change') ||
    content.includes('major revision') ||
    content.includes('substantial increase')
  ) {
    return 'high';
  }
  
  // Check for medium impact keywords
  if (
    content.includes('modification') || 
    content.includes('amendment') ||
    content.includes('updated rates') ||
    content.includes('changes to')
  ) {
    return 'medium';
  }
  
  // Default to low impact
  return 'low';
}
