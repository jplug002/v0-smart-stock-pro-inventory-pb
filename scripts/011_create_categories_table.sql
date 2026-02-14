-- Create categories table for product categorization
-- This table allows users to create custom categories for their products

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Default indigo color for category badge
  icon TEXT DEFAULT 'package', -- Default icon name
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Insert some default categories for new users (optional)
-- You can run this separately or trigger it on user creation
-- INSERT INTO categories (user_id, name, description, color, icon) VALUES
--   (auth.uid(), 'Electronics', 'Electronic devices and accessories', '#3b82f6', 'smartphone'),
--   (auth.uid(), 'Clothing', 'Apparel and fashion items', '#ec4899', 'shirt'),
--   (auth.uid(), 'Food & Beverages', 'Food items and drinks', '#22c55e', 'utensils'),
--   (auth.uid(), 'Health & Beauty', 'Personal care and beauty products', '#a855f7', 'heart'),
--   (auth.uid(), 'Home & Garden', 'Household items and garden supplies', '#f97316', 'home');

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();
