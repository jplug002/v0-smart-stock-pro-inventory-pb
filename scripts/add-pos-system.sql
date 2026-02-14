-- Create cart items table for POS
CREATE TABLE IF NOT EXISTS pos_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_type TEXT, -- 'fixed' or 'percentage'
  discount_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create POS transactions table
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'mobile_money', 'cheque'
  payment_status TEXT DEFAULT 'completed', -- 'completed', 'pending', 'refunded'
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create POS transaction items table
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pos_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own cart" ON pos_cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON pos_cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON pos_cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON pos_cart FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON pos_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON pos_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON pos_transactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction items" ON pos_transaction_items FOR SELECT 
  USING (transaction_id IN (SELECT id FROM pos_transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own transaction items" ON pos_transaction_items FOR INSERT 
  WITH CHECK (transaction_id IN (SELECT id FROM pos_transactions WHERE user_id = auth.uid()));
