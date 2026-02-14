-- Create product_discounts table for managing discounts on specific products
CREATE TABLE IF NOT EXISTS product_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for product_discounts
ALTER TABLE product_discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_discounts
CREATE POLICY "Users can view own discounts" ON product_discounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create discounts" ON product_discounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discounts" ON product_discounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discounts" ON product_discounts FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_product_discounts_user_id ON product_discounts(user_id);
CREATE INDEX idx_product_discounts_product_id ON product_discounts(product_id);
