import { createLogger } from '@/lib/services/logger';
import { dataCache } from '@/lib/services/cache';

const logger = createLogger('usitc-service');
const CACHE_KEY_PREFIX = 'usitc';

export class USITCService {
  private readonly baseUrl = 'https://hts.usitc.gov/api/';

  async getHtsChapter(chapter: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:chapter:${chapter}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}chapters/${chapter}`);
      if (!response.ok) throw new Error(`Failed to fetch HTS chapter ${chapter}`);

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching HTS chapter', error as Error);
      throw error;
    }
  }

  async searchHtsCodes(query: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:search:${query}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search HTS codes');

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error searching HTS codes', error as Error);
      throw error;
    }
  }

  async getGeneralRates(htsCode: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:rates:${htsCode}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}rates/${htsCode}`);
      if (!response.ok) throw new Error(`Failed to fetch rates for HTS code ${htsCode}`);

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching general rates', error as Error);
      throw error;
    }
  }
}

export const usitcService = new USITCService();