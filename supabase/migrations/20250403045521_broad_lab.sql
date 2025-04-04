/*
  # Initial Schema for Tariffs Tracker

  1. New Tables
    - `products`
      - Core product information and HTS codes
    - `countries`
      - Country information and trade agreements
    - `tariff_rates`
      - Current and historical tariff rates by product and country
    - `trade_updates`
      - News and policy updates
    - `compliance_requirements`
      - Product compliance and certification requirements
    - `user_watchlists`
      - User product and country tracking preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access for product and tariff data
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hts_code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag_url text,
  trade_agreements text[],
  special_tariffs text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tariff_rates table
CREATE TABLE IF NOT EXISTS tariff_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
  base_rate decimal NOT NULL,
  additional_rates jsonb DEFAULT '[]',
  total_rate decimal NOT NULL,
  effective_date date NOT NULL,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, country_id, effective_date)
);

-- Create trade_updates table
CREATE TABLE IF NOT EXISTS trade_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  impact text,
  source_url text,
  published_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create compliance_requirements table
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  requirement text NOT NULL,
  description text,
  authority text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_watchlists table
CREATE TABLE IF NOT EXISTS user_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
  notify_changes boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, country_id)
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Products: Public read access, admin write
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  TO public
  USING (true);

-- Countries: Public read access, admin write
CREATE POLICY "Countries are viewable by everyone"
  ON countries FOR SELECT
  TO public
  USING (true);

-- Tariff Rates: Public read access, admin write
CREATE POLICY "Tariff rates are viewable by everyone"
  ON tariff_rates FOR SELECT
  TO public
  USING (true);

-- Trade Updates: Public read access, admin write
CREATE POLICY "Trade updates are viewable by everyone"
  ON trade_updates FOR SELECT
  TO public
  USING (true);

-- Compliance Requirements: Public read access, admin write
CREATE POLICY "Compliance requirements are viewable by everyone"
  ON compliance_requirements FOR SELECT
  TO public
  USING (true);

-- User Watchlists: Private to each user
CREATE POLICY "Users can manage their own watchlists"
  ON user_watchlists
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_rates_updated_at
  BEFORE UPDATE ON tariff_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_updates_updated_at
  BEFORE UPDATE ON trade_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_requirements_updated_at
  BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_watchlists_updated_at
  BEFORE UPDATE ON user_watchlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();