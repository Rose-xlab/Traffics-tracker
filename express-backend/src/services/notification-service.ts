import logger, { createLogger } from '../utils/logger';
import { supabase } from '../utils/database';
import type { NotificationPreferences } from '../api/types';

const loga = createLogger('notification-service', logger);

export class NotificationService {
  async sendNotification(userId: string, title: string, message: string, type: string, metadata: any = {}) {
    try {
      const { data: preferences } = await this.getUserPreferences(userId);
      
      if (!preferences || !this.shouldSendNotification(preferences, type)) {
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          read: false,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      if (preferences.email) {
        await this.sendEmail(userId, title, message);
      }

      if (preferences.push) {
        await this.sendPushNotification(userId, title, message);
      }

      loga.info(`Notification sent to user ${userId}`);
    } catch (error) {
      loga.error('Error sending notification', error as Error);
      throw error;
    }
  }

  private async getUserPreferences(userId: string) {
    return await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
  }

  private shouldSendNotification(
    preferences: NotificationPreferences,
    type: string
  ): boolean {
    switch (type) {
      case 'rate_change':
        return preferences.types.rate_changes;
      case 'new_ruling':
        return preferences.types.new_rulings;
      case 'exclusion':
        return preferences.types.exclusions;
      case 'system':
        return true; // System notifications are always sent
      default:
        return false;
    }
  }

  private async sendEmail(userId: string, title: string, message: string) {
    // Implement email sending logic
    // In a production environment, you'd integrate with an email service
    // like SendGrid, AWS SES, etc.
    loga.info(`Would send email to user ${userId}: ${title} - ${message}`);
  }

  private async sendPushNotification(userId: string, title: string, message: string) {
    // Implement push notification logic
    // In a production environment, you'd integrate with a push notification service
    // like Firebase Cloud Messaging, OneSignal, etc.
    loga.info(`Would send push notification to user ${userId}: ${title} - ${message}`);
  }

  /**
   * Notify product watchers about changes
   */
  async notifyProductWatchers(data: {
    title: string;
    message: string;
    type: 'rate_change' | 'new_ruling' | 'exclusion' | 'system';
    productId?: string;
    countryId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      loga.info(`Creating notification for product ${data.productId}`);
      
      if (!data.productId) {
        throw new Error('Product ID is required for product notifications');
      }
      
      // Find users watching this product
      const { data: watchlist, error: watchlistError } = await supabase
        .from('user_watchlists')
        .select('user_id')
        .eq('product_id', data.productId)
        .eq('notify_changes', true);
        
      if (watchlistError) throw watchlistError;
      
      if (!watchlist || watchlist.length === 0) {
        loga.info(`No watchers found for product ${data.productId}`);
        return;
      }
      
      // Send notification to each user
      for (const item of watchlist) {
        await this.sendNotification(
          item.user_id,
          data.title,
          data.message,
          data.type,
          { 
            ...data.metadata,
            productId: data.productId,
            countryId: data.countryId
          }
        );
      }
      
      loga.info(`Created notifications for ${watchlist.length} users watching product ${data.productId}`);
    } catch (error) {
      loga.error(`Error creating notifications for product ${data.productId}`, error as Error);
      throw error;
    }
  }

  /**
   * Check product changes and send notifications
   */
  async checkProductChanges(
    productId: string,
    oldData: any,
    newData: any
  ): Promise<void> {
    try {
      loga.info(`Checking for changes in product ${productId}`);
      
      // Check for rate changes
      if (oldData.total_rate !== newData.total_rate) {
        await this.notifyProductWatchers({
          title: 'Tariff Rate Changed',
          message: `The tariff rate for ${newData.name} has changed from ${oldData.total_rate}% to ${newData.total_rate}%`,
          type: 'rate_change',
          productId
        });
      }
      
      // Check for new rulings
      const oldRulingCount = Array.isArray(oldData.rulings) ? oldData.rulings.length : 0;
      const newRulingCount = Array.isArray(newData.rulings) ? newData.rulings.length : 0;
      
      if (newRulingCount > oldRulingCount) {
        await this.notifyProductWatchers({
          title: 'New Ruling Available',
          message: `A new customs ruling has been issued for ${newData.name}`,
          type: 'new_ruling',
          productId
        });
      }
      
      // Check for new exclusions
      const oldExclusionCount = Array.isArray(oldData.exclusions) ? oldData.exclusions.length : 0;
      const newExclusionCount = Array.isArray(newData.exclusions) ? newData.exclusions.length : 0;
      
      if (newExclusionCount > oldExclusionCount) {
        await this.notifyProductWatchers({
          title: 'New Exclusion Available',
          message: `A new exclusion has been added for ${newData.name}`,
          type: 'exclusion',
          productId
        });
      }
      
      loga.info(`Completed change check for product ${productId}`);
    } catch (error) {
      loga.error(`Error checking product changes for ${productId}`, error as Error);
      throw error;
    }
  }

  /**
   * Notify about HTS updates
   */
  async notifyHtsUpdates(updatedProducts: string[]): Promise<void> {
    try {
      if (!updatedProducts.length) return;
      
      loga.info(`Notifying about HTS updates for ${updatedProducts.length} products`);
      
      // Get product details
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .in('id', updatedProducts);
        
      if (error) throw error;
      
      // Notify watchers for each product
      for (const product of products) {
        await this.notifyProductWatchers({
          title: 'HTS Update Available',
          message: `The tariff information for ${product.name} has been updated with the latest HTS data`,
          type: 'rate_change',
          productId: product.id
        });
      }
      
      loga.info('HTS update notifications completed');
    } catch (error) {
      loga.error('Error sending HTS update notifications', error as Error);
      throw error;
    }
  }

  /**
   * Notify about trade updates
   */
  async notifyAboutTradeUpdates(updateId: string): Promise<void> {
    try {
      logger.info(`Notifying users about trade update ${updateId}`);
      
      // Get update details
      const { data: update, error: updateError } = await supabase
        .from('trade_updates')
        .select('*')
        .eq('id', updateId)
        .single();
        
      if (updateError) throw updateError;
      
      // Extract any HTS codes mentioned in the update
      const htsCodeRegex = /\b\d{4}\.\d{2}\.\d{4}\b/g;
      const htsCodes = (update.description.match(htsCodeRegex) || []);
      
      if (htsCodes.length > 0) {
        // Find products matching these HTS codes
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .in('hts_code', htsCodes);
          
        if (productsError) throw productsError;
        
        // Notify watchers of each affected product
        for (const product of products) {
          await this.notifyProductWatchers({
            title: 'Trade Policy Update',
            message: `A trade policy update may affect ${product.name}: ${update.title}`,
            type: 'system',
            productId: product.id,
            metadata: { updateId: update.id }
          });
        }
      }
      
      loga.info(`Successfully notified users about trade update ${updateId}`);
    } catch (error) {
      loga.error(`Error notifying about trade update ${updateId}`, error as Error);
      throw error;
    }
  }
}

export const notifyProductWatchers = new NotificationService();
