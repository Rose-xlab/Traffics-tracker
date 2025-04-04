import { createLogger } from '@/lib/services/logger';
import { createClient } from '@/lib/supabase/server';
import type { NotificationPreferences } from '@/types/api';

const logger = createLogger('notification-service');

export class NotificationService {
  private readonly supabase = createClient();

  async sendNotification(userId: string, message: string, type: string) {
    try {
      const { data: preferences } = await this.getUserPreferences(userId);
      
      if (!preferences || !this.shouldSendNotification(preferences, type)) {
        return;
      }

      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message,
          type,
          read: false,
        });

      if (error) throw error;

      if (preferences.email) {
        await this.sendEmail(userId, message);
      }

      if (preferences.push) {
        await this.sendPushNotification(userId, message);
      }

      logger.info(`Notification sent to user ${userId}`);
    } catch (error) {
      logger.error('Error sending notification', error as Error);
      throw error;
    }
  }

  private async getUserPreferences(userId: string) {
    return await this.supabase
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
      default:
        return false;
    }
  }

  private async sendEmail(userId: string, message: string) {
    // Implement email sending logic
    logger.info(`Would send email to user ${userId}: ${message}`);
  }

  private async sendPushNotification(userId: string, message: string) {
    // Implement push notification logic
    logger.info(`Would send push notification to user ${userId}: ${message}`);
  }
}

export const notificationService = new NotificationService();