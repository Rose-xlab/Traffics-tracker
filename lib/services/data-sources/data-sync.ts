import { createLogger } from '@/lib/services/logger';
import { usitcService } from './usitc';
import { ustrService } from './ustr';
import { cbpService } from './cbp';
import { federalRegisterService } from './federal-register';
import { dataProcessor } from '../data-processor';
import { createClient } from '@/lib/supabase/server';

const logger = createLogger('data-sync');

export class DataSync {
  private readonly supabase = createClient();

  async syncAll() {
    try {
      await Promise.all([
        this.syncHtsData(),
        this.syncSection301Data(),
        this.syncRulings(),
        this.syncUpdates()
      ]);

      logger.info('Completed full data sync');
    } catch (error) {
      logger.error('Error during full sync', error as Error);
      throw error;
    }
  }

  private async syncHtsData() {
    try {
      // Get all HTS chapters
      for (let chapter = 1; chapter <= 99; chapter++) {
        const chapterData = await usitcService.getHtsChapter(
          chapter.toString().padStart(2, '0')
        );

        // Process and store each HTS code
        for (const section of chapterData.sections) {
          for (const rate of section.rates) {
            const { data, error } = await this.supabase
              .from('products')
              .upsert({
                hts_code: rate.hts_code,
                name: rate.description,
                base_rate: rate.rate,
                category: section.description,
                last_updated: new Date().toISOString()
              })
              .select()
              .single();

            if (error) throw error;
          }
        }
      }

      logger.info('Completed HTS data sync');
    } catch (error) {
      logger.error('Error syncing HTS data', error as Error);
      throw error;
    }
  }

  private async syncSection301Data() {
    try {
      const section301Data = await ustrService.getSection301Tariffs();

      for (const tariff of section301Data) {
        const { error } = await this.supabase
          .from('products')
          .update({
            additional_rates: tariff,
            last_updated: new Date().toISOString()
          })
          .eq('hts_code', tariff.hts_code);

        if (error) throw error;
      }

      logger.info('Completed Section 301 data sync');
    } catch (error) {
      logger.error('Error syncing Section 301 data', error as Error);
      throw error;
    }
  }

  private async syncRulings() {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('hts_code');

      if (error) throw error;

      for (const product of products) {
        const rulings = await cbpService.getRulings(product.hts_code);

        const { error: updateError } = await this.supabase
          .from('products')
          .update({
            rulings,
            last_updated: new Date().toISOString()
          })
          .eq('hts_code', product.hts_code);

        if (updateError) throw updateError;
      }

      logger.info('Completed rulings sync');
    } catch (error) {
      logger.error('Error syncing rulings', error as Error);
      throw error;
    }
  }

  private async syncUpdates() {
    try {
      const notices = await federalRegisterService.getTariffNotices();

      for (const notice of notices) {
        const processed = await dataProcessor.processDocument(notice.abstract);

        const { error } = await this.supabase
          .from('trade_updates')
          .insert({
            title: notice.title,
            description: processed.summary,
            impact: processed.impact,
            source_url: notice.html_url,
            source_reference: notice.document_number,
            published_date: notice.publication_date
          });

        if (error) throw error;
      }

      logger.info('Completed updates sync');
    } catch (error) {
      logger.error('Error syncing updates', error as Error);
      throw error;
    }
  }
}

export const dataSync = new DataSync();