import { createLogger } from '@/lib/services/logger';
import { usitcService } from './data-sources/usitc';
import { ustrService } from './data-sources/ustr';
import { cbpService } from './data-sources/cbp';
import { federalRegisterService } from './data-sources/federal-register';
import { createClient } from '@/lib/supabase/server';

const logger = createLogger('tariff-aggregator');

export class TariffAggregator {
  private readonly supabase = createClient();

  async aggregateProductData(htsCode: string) {
    try {
      // Fetch data from all sources
      const [
        generalRates,
        section301Tariffs,
        exclusions,
        rulings,
        effectiveDates
      ] = await Promise.all([
        usitcService.getGeneralRates(htsCode),
        ustrService.getSection301Tariffs(),
        ustrService.getExclusions(htsCode),
        cbpService.getRulings(htsCode),
        federalRegisterService.getEffectiveDates(htsCode)
      ]);

      // Calculate total rate including all applicable tariffs
      const totalRate = this.calculateTotalRate(generalRates, section301Tariffs);

      // Compile complete product information
      const productData = {
        hts_code: htsCode,
        base_rate: generalRates.rate,
        additional_rates: section301Tariffs,
        total_rate: totalRate,
        exclusions: exclusions,
        rulings: rulings,
        effective_dates: effectiveDates,
        last_updated: new Date().toISOString()
      };

      // Update database
      const { error } = await this.supabase
        .from('products')
        .upsert(productData)
        .eq('hts_code', htsCode);

      if (error) throw error;

      return productData;
    } catch (error) {
      logger.error('Error aggregating product data', error as Error);
      throw error;
    }
  }

  private calculateTotalRate(generalRates: any, section301Tariffs: any): number {
    try {
      const baseRate = parseFloat(generalRates.rate) || 0;
      const additionalRates = section301Tariffs.reduce(
        (sum: number, tariff: any) => sum + (parseFloat(tariff.rate) || 0),
        0
      );
      return baseRate + additionalRates;
    } catch (error) {
      logger.error('Error calculating total rate', error as Error);
      throw error;
    }
  }

  async updateAllProducts() {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('hts_code');

      if (error) throw error;

      for (const product of products) {
        await this.aggregateProductData(product.hts_code);
      }

      logger.info(`Updated ${products.length} products`);
    } catch (error) {
      logger.error('Error updating all products', error as Error);
      throw error;
    }
  }
}

export const tariffAggregator = new TariffAggregator();