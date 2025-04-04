"use client";

import { createClient } from '@/lib/supabase/client';
import { createLogger } from '@/lib/services/logger';

const logger = createLogger('rate-limiter-service');

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiterService {
  private readonly supabase = createClient();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async isRateLimited(key: string): Promise<boolean> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.config.windowMs);

      // Get request count within window
      const { count, error } = await this.supabase
        .from('rate_limit_requests')
        .select('*', { count: 'exact' })
        .eq('key', key)
        .gte('timestamp', windowStart.toISOString());

      if (error) throw error;

      if (count >= this.config.maxRequests) {
        return true;
      }

      // Record new request
      const { error: insertError } = await this.supabase
        .from('rate_limit_requests')
        .insert({
          key,
          timestamp: now.toISOString(),
        });

      if (insertError) throw insertError;

      return false;
    } catch (error) {
      logger.error('Error checking rate limit', error as Error);
      return false; // Fail open if there's an error
    }
  }

  async cleanup() {
    try {
      const cutoff = new Date(Date.now() - this.config.windowMs);
      
      const { error } = await this.supabase
        .from('rate_limit_requests')
        .delete()
        .lt('timestamp', cutoff.toISOString());

      if (error) throw error;
    } catch (error) {
      logger.error('Error cleaning up rate limit records', error as Error);
    }
  }
}

export const rateLimiterService = new RateLimiterService({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});