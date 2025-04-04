"use client";

import { createClient } from '@/lib/supabase/client';
import { createLogger } from '@/lib/services/logger';
import { usitcService } from './data-sources/usitc';
import { ustrService } from './data-sources/ustr';
import { cbpService } from './data-sources/cbp';
import { federalRegisterService } from './data-sources/federal-register';
import { dataProcessor } from './data-processor';
import PQueue from 'p-queue';
import pRetry from 'p-retry';

const logger = createLogger('data-sync-service');

export class DataSyncService {
  private readonly supabase = createClient();
  private readonly queue: PQueue;

  constructor() {
    this.queue = new PQueue({ concurrency: 3 });
  }

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
        await this.queue.add(() =>
          pRetry(
            async () => {
              const chapterData = await usitcService.getHtsChapter(
                chapter.toString().padStart(2, '0')
              );

              // Process and store each HTS code
              for (const section of chapterData.sections) {
                for (const rate of section.rates) {
                  await this.supabase
                    .from('products')
                    .upsert({
                      hts_code: rate.hts_code,
                      name: rate.description,
                      base_rate: rate.rate,
                      category: section.description,
                      last_updated: new Date().toISOString()
                    });
                }
              }
            },
            { retries: 3 }
          )
        );
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

      await Promise.all(
        section301Data.map(tariff =>
          this.queue.add(() =>
            pRetry(
              async () => {
                await this.supabase
                  .from('products')
                  .update({
                    additional_rates: tariff,
                    last_updated: new Date().toISOString()
                  })
                  .eq('hts_code', tariff.hts_code);
              },
              { retries: 3 }
            )
          )
        )
      );

      logger.info('Completed Section 301 data sync');
    } catch (error) {
      logger.error('Error syncing Section 301 data', error as Error);
      throw error;
    }
  }

  private async syncRulings() {
    try {
      const { data: products } = await this.supabase
        .from('products')
        .select('hts_code');

      await Promise.all(
        products.map(product =>
          this.queue.add(() =>
            pRetry(
              async () => {
                const rulings = await cbpService.getRulings(product.hts_code);
                await this.supabase
                  .from('products')
                  .update({
                    rulings,
                    last_updated: new Date().toISOString()
                  })
                  .eq('hts_code', product.hts_code);
              },
              { retries: 3 }
            )
          )
        )
      );

      logger.info('Completed rulings sync');
    } catch (error) {
      logger.error('Error syncing rulings', error as Error);
      throw error;
    }
  }

  private async syncUpdates() {
    try {
      const notices = await federalRegisterService.getTariffNotices();

      await Promise.all(
        notices.map(notice =>
          this.queue.add(() =>
            pRetry(
              async () => {
                const processed = await dataProcessor.processDocument(notice.abstract);
                await this.supabase
                  .from('trade_updates')
                  .insert({
                    title: notice.title,
                    description: processed.summary,
                    impact: processed.impact,
                    source_url: notice.html_url,
                    source_reference: notice.document_number,
                    published_date: notice.publication_date
                  });
              },
              { retries: 3 }
            )
          )
        )
      );

      logger.info('Completed updates sync');
    } catch (error) {
      logger.error('Error syncing updates', error as Error);
      throw error;
    }
  }
}

export const dataSyncService = new DataSyncService();