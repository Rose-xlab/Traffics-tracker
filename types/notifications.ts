export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'rate_change' | 'new_ruling' | 'exclusion' | 'system';
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  types: {
    rate_changes: boolean;
    new_rulings: boolean;
    exclusions: boolean;
  };
  created_at: string;
  updated_at: string;
}