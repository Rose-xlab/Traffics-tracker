"use client";

import { createClient } from '@/lib/supabase/client';
import { createLogger } from '@/lib/services/logger';
import type { NotificationPreferences } from '@/types/api';

const logger = createLogger('notification-service');

export class NotificationService {
  private readonly supabase = createClient();

  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching notification preferences', error as Error);
      throw error;
    }
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating notification preferences', error as Error);
      throw error;
    }
  }

  async getNotifications(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching notifications', error as Error);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking notification as read', error as Error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();