import { createLogger } from '@/lib/services/logger';
import { dataCache } from '@/lib/services/cache';

const logger = createLogger('cbp-service');
const CACHE_KEY_PREFIX = 'cbp';

export class CBPService {
  private readonly baseUrl = 'https://www.cbp.gov/api/';

  async getRulings(htsCode: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:rulings:${htsCode}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}rulings/${htsCode}`);
      if (!response.ok) throw new Error(`Failed to fetch rulings for HTS code ${htsCode}`);

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching CBP rulings', error as Error);
      throw error;
    }
  }

  async getImplementationGuidance(topic: string): Promise<any> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}:guidance:${topic}`;
      const cached = dataCache.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${this.baseUrl}guidance/${topic}`);
      if (!response.ok) throw new Error(`Failed to fetch guidance for ${topic}`);

      const data = await response.json();
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching implementation guidance', error as Error);
      throw error;
    }
  }
}

export const cbpService = new CBPService();