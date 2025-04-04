import { createLogger } from '@/lib/services/logger';
import { federalRegisterService } from './data-sources/federal-register';
import { tariffAggregator } from './tariff-aggregator';
import { createClient } from '@/lib/supabase/server';

const logger = createLogger('update-monitor');

export class UpdateMonitor {
  private readonly supabase = createClient();

  async checkForUpdates() {
    try {
      const notices = await federalRegisterService.getTariffNotices();
      
      for (const notice of notices) {
        const exists = await this.checkIfUpdateExists(notice.document_number);
        if (!exists) {
          await this.processNewUpdate(notice);
        }
      }
    } catch (error) {
      logger.error('Error checking for updates', error as Error);
      throw error;
    }
  }

  private async checkIfUpdateExists(documentNumber: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('trade_updates')
      .select('id')
      .eq('source_reference', documentNumber)
      .single();

    if (error) throw error;
    return !!data;
  }

  private async processNewUpdate(notice: any) {
    try {
      // Create trade update record
      const { error: insertError } = await this.supabase
        .from('trade_updates')
        .insert({
          title: notice.title,
          description: notice.abstract,
          source_url: notice.html_url,
          source_reference: notice.document_number,
          published_date: notice.publication_date,
          impact: this.determineImpact(notice)
        });

      if (insertError) throw insertError;

      // Update affected products
      if (notice.hts_codes) {
        for (const htsCode of notice.hts_codes) {
          await tariffAggregator.aggregateProductData(htsCode);
        }
      }

      // Notify affected users
      await this.notifyAffectedUsers(notice);

      logger.info(`Processed new update: ${notice.document_number}`);
    } catch (error) {
      logger.error('Error processing new update', error as Error);
      throw error;
    }
  }

  private determineImpact(notice: any): string {
    // Analyze notice content to determine impact level
    const content = notice.abstract.toLowerCase();
    if (content.includes('immediate effect') || content.includes('significant change')) {
      return 'high';
    } else if (content.includes('modification') || content.includes('amendment')) {
      return 'medium';
    }
    return 'low';
  }

  private async notifyAffectedUsers(notice: any) {
    try {
      if (!notice.hts_codes) return;

      const { data: watchlists, error } = await this.supabase
        .from('user_watchlists')
        .select('user_id, products!inner(*)')
        .filter('products.hts_code', 'in', `(${notice.hts_codes.join(',')})`)
        .eq('notify_changes', true);

      if (error) throw error;

      // Here you would integrate with your notification system
      // For now, we'll just log the notifications
      for (const watchlist of watchlists) {
        logger.info(`Would notify user ${watchlist.user_id} about update ${notice.document_number}`);
      }
    } catch (error) {
      logger.error('Error notifying affected users', error as Error);
      throw error;
    }
  }
}

export const updateMonitor = new UpdateMonitor();