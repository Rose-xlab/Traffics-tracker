/*
  # Add Analytics and Notifications Tables

  1. New Tables
    - `analytics_events`
      - Track user interactions and system events
    - `notifications`
      - Store user notifications
    - `notification_preferences`
      - User notification settings
    - `search_suggestions`
      - Search autocomplete and trending terms
    - `rate_limit_requests`
      - API rate limiting tracking

  2. Security
    - Enable RLS on all tables
    - Add appropriate access policies
*/

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  data jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  url text
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email boolean DEFAULT true,
  push boolean DEFAULT false,
  frequency text DEFAULT 'daily',
  types jsonb DEFAULT '{"rate_changes": true, "new_rulings": true, "exclusions": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search_suggestions table
CREATE TABLE IF NOT EXISTS search_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text UNIQUE NOT NULL,
  frequency integer DEFAULT 1,
  last_searched timestamptz DEFAULT now()
);

-- Create rate_limit_requests table
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Analytics Events: Admin read, public write
CREATE POLICY "Analytics events are insertable by everyone"
  ON analytics_events FOR INSERT
  TO public
  WITH CHECK (true);

-- Notifications: Private to each user
CREATE POLICY "Users can view their own notifications"
  ON notifications
  TO authenticated
  USING (auth.uid() = user_id);

-- Notification Preferences: Private to each user
CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Search Suggestions: Public read, admin write
CREATE POLICY "Search suggestions are viewable by everyone"
  ON search_suggestions FOR SELECT
  TO public
  USING (true);

-- Rate Limit Requests: Admin only
CREATE POLICY "Rate limit requests are managed by admin"
  ON rate_limit_requests
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_search_suggestions_term ON search_suggestions(term text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_frequency ON search_suggestions(frequency DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_requests_key_timestamp ON rate_limit_requests(key, timestamp);

-- Add updated_at trigger to notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();