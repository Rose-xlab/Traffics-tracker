import { createLogger } from '@/lib/services/logger';
import { dataCache } from '@/lib/services/cache';

const logger = createLogger('ustr-service');
const CACHE_KEY_PREFIX = 'ustr';

export class USTRService {
  private readonly baseUrl = 'https://ustr.gov/api/';

  async getSection301Tariffs(): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:section301`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}section301/current`);
      if (!response.ok) throw new Error('Failed to fetch Section 301 tariffs');

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching Section 301 tariffs', error as Error);
      throw error;
    }
  }

  async getExclusions(htsCode: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:exclusions:${htsCode}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}exclusions/${htsCode}`);
      if (!response.ok) throw new Error(`Failed to fetch exclusions for HTS code ${htsCode}`);

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching exclusions', error as Error);
      throw error;
    }
  }

  async getTradeAgreements(): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:agreements`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}agreements`);
      if (!response.ok) throw new Error('Failed to fetch trade agreements');

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching trade agreements', error as Error);
      throw error;
    }
  }
}

export const ustrService = new USTRService();