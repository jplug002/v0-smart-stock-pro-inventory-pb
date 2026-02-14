-- SmartStocks Pro - Updated Subscription Plans
-- This migration updates the plan_limits table with new pricing structure

-- Clear existing plan limits and insert new ones
DELETE FROM plan_limits;

-- Insert updated plan limits based on finalized pricing
-- Free Plan: $0/month - 1 business, 50 products
INSERT INTO plan_limits (
  plan, max_businesses, max_products, max_staff, max_suppliers, 
  max_users_per_business, max_api_calls_per_month, export_limit_per_month
) VALUES (
  'free', 1, 50, 0, 0, 1, 100, 5
);

-- Pro Plan: $2.99/month - 2 businesses, 100 products
INSERT INTO plan_limits (
  plan, max_businesses, max_products, max_staff, max_suppliers, 
  max_users_per_business, max_api_calls_per_month, export_limit_per_month
) VALUES (
  'pro', 2, 100, 0, 0, 1, 1000, 20
);

-- Pro Plus Plan: $3.99/month - 5 businesses, unlimited products
INSERT INTO plan_limits (
  plan, max_businesses, max_products, max_staff, max_suppliers, 
  max_users_per_business, max_api_calls_per_month, export_limit_per_month
) VALUES (
  'pro_plus', 5, -1, 10, -1, 3, 10000, 100
);

-- Enterprise Plan: $7.99/month - unlimited everything
INSERT INTO plan_limits (
  plan, max_businesses, max_products, max_staff, max_suppliers, 
  max_users_per_business, max_api_calls_per_month, export_limit_per_month
) VALUES (
  'enterprise', -1, -1, -1, -1, -1, -1, -1
);

-- Add paystack_plan_code column to subscriptions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'paystack_subscription_code'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN paystack_subscription_code TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'paystack_customer_code'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN paystack_customer_code TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create paystack_transactions table for tracking payments
CREATE TABLE IF NOT EXISTS paystack_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  reference TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending',
  paystack_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on paystack_transactions
ALTER TABLE paystack_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paystack_transactions
CREATE POLICY "Users can view own transactions" ON paystack_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON paystack_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON paystack_transactions
  FOR UPDATE USING (true);
