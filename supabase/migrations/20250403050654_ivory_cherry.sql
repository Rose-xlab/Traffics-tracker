/*
  # Add Product Details and Update Schema

  1. Changes
    - Add new columns to products table for detailed tariff information
    - Update trade_updates table structure
    - Add indexes for performance optimization

  2. New Columns
    Products table:
    - base_rate (decimal)
    - additional_rates (jsonb)
    - total_rate (decimal)
    - exclusions (jsonb)
    - rulings (jsonb)
    - effective_dates (jsonb)
    - last_updated (timestamptz)

    Trade Updates table:
    - source_reference (text)
    - Make impact column required
*/

-- Add new columns to products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'base_rate'
  ) THEN
    ALTER TABLE products 
      ADD COLUMN base_rate decimal NOT NULL DEFAULT 0,
      ADD COLUMN additional_rates jsonb DEFAULT '[]',
      ADD COLUMN total_rate decimal NOT NULL DEFAULT 0,
      ADD COLUMN exclusions jsonb DEFAULT '[]',
      ADD COLUMN rulings jsonb DEFAULT '[]',
      ADD COLUMN effective_dates jsonb DEFAULT '[]',
      ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
END $$;

-- Update trade_updates table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_updates' AND column_name = 'source_reference'
  ) THEN
    ALTER TABLE trade_updates 
      ADD COLUMN source_reference text NOT NULL DEFAULT '',
      ALTER COLUMN impact SET NOT NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_hts_code ON products(hts_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_trade_updates_published_date ON trade_updates(published_date);
CREATE INDEX IF NOT EXISTS idx_trade_updates_source_reference ON trade_updates(source_reference);

-- Add constraint for impact levels
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'impact_level'
  ) THEN
    CREATE TYPE impact_level AS ENUM ('low', 'medium', 'high');
    ALTER TABLE trade_updates 
      ALTER COLUMN impact TYPE impact_level USING impact::impact_level;
  END IF;
END $$;