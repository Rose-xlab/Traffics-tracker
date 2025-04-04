import { createLogger } from '@/lib/services/logger';
import { createClient } from '@/lib/supabase/server';
import type { WatchlistItem } from '@/types/api';

const logger = createLogger('watchlist-service');

export class WatchlistService {
  private readonly supabase = createClient();

  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_watchlists')
        .select(`
          *,
          products (*),
          countries (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data as unknown as WatchlistItem[];
    } catch (error) {
      logger.error('Error fetching watchlist', error as Error);
      throw error;
    }
  }

  async addToWatchlist(
    userId: string,
    productId: string,
    countryId: string,
    notifyChanges: boolean = true
  ) {
    try {
      const { data, error } = await this.supabase
        .from('user_watchlists')
        .insert({
          user_id: userId,
          product_id: productId,
          country_id: countryId,
          notify_changes: notifyChanges,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding to watchlist', error as Error);
      throw error;
    }
  }

  async removeFromWatchlist(userId: string, watchlistId: string) {
    try {
      const { error } = await this.supabase
        .from('user_watchlists')
        .delete()
        .eq('id', watchlistId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error removing from watchlist', error as Error);
      throw error;
    }
  }

  async updateNotificationPreference(
    userId: string,
    watchlistId: string,
    notifyChanges: boolean
  ) {
    try {
      const { data, error } = await this.supabase
        .from('user_watchlists')
        .update({ notify_changes: notifyChanges })
        .eq('id', watchlistId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating notification preference', error as Error);
      throw error;
    }
  }
}

export const watchlistService = new WatchlistService();