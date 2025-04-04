import { createLogger } from '@/lib/services/logger';
import { dataCache } from '@/lib/services/cache';

const logger = createLogger('federal-register-service');
const CACHE_KEY_PREFIX = 'fr';

export class FederalRegisterService {
  private readonly baseUrl = 'https://www.federalregister.gov/api/v1/';

  async getTariffNotices(): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:notices`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}documents?conditions[type]=NOTICE&conditions[topics][]=tariffs`);
      if (!response.ok) throw new Error('Failed to fetch tariff notices');

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching Federal Register notices', error as Error);
      throw error;
    }
  }

  async getEffectiveDates(htsCode: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:dates:${htsCode}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}documents?conditions[hts_code]=${htsCode}`);
      if (!response.ok) throw new Error(`Failed to fetch effective dates for HTS code ${htsCode}`);

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching effective dates', error as Error);
      throw error;
    }
  }
}

export const federalRegisterService = new FederalRegisterService();