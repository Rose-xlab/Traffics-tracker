"use client";

import { createClient } from '@/lib/supabase/client';
import { createLogger } from '@/lib/services/logger';

const logger = createLogger('analytics-service');

export type EventType = 
  | 'search'
  | 'view_product'
  | 'calculate_duty'
  | 'add_to_watchlist'
  | 'remove_from_watchlist'
  | 'error';

export interface EventData {
  userId?: string;
  productId?: string;
  countryId?: string;
  searchQuery?: string;
  category?: string;
  errorMessage?: string;
  [key: string]: any;
}

export class AnalyticsService {
  private readonly supabase = createClient();

  async trackEvent(type: EventType, data: EventData = {}) {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert({
          type,
          data,
          user_id: data.userId,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error tracking analytics event', error as Error);
    }
  }

  async getPopularProducts(limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('data->productId')
        .eq('type', 'view_product')
        .limit(1000);

      if (error) throw error;

      // Count product views
      const productViews = data.reduce((acc, event) => {
        const productId = event.data?.productId;
        if (productId) {
          acc[productId] = (acc[productId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Sort by views and get top products
      return Object.entries(productViews)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([productId]) => productId);
    } catch (error) {
      logger.error('Error getting popular products', error as Error);
      throw error;
    }
  }

  async getSearchTrends(days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('data->searchQuery, timestamp')
        .eq('type', 'search')
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      // Aggregate search terms
      return data.reduce((acc, event) => {
        const searchQuery = event.data?.searchQuery;
        if (searchQuery) {
          acc[searchQuery] = (acc[searchQuery] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Error getting search trends', error as Error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();