-- Create comprehensive pricing and plans tables for Free, Pro, Pro Plus, and Enterprise tiers

-- Create plans table defining available subscription tiers
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')) DEFAULT 'monthly',
  features JSONB DEFAULT '[]', -- Array of feature strings
  max_users INTEGER,
  max_products INTEGER,
  max_businesses INTEGER,
  max_storage_gb DECIMAL(10, 2),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add plan_id to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')) DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;

-- Create usage tracking table for plan limits
CREATE TABLE IF NOT EXISTS plan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  products_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  expenses_count INTEGER DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  reset_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Insert the four pricing tiers
INSERT INTO plans (name, slug, description, price, currency, billing_period, features, max_users, max_products, max_businesses, max_storage_gb, is_featured) VALUES
(
  'Free',
  'free',
  'Perfect for getting started with inventory management',
  0,
  'USD',
  'monthly',
  '["Basic inventory tracking", "Up to 100 products", "Single business", "Basic reports", "Email support"]'::jsonb,
  1,
  100,
  1,
  1,
  FALSE
),
(
  'Pro',
  'pro',
  'Best for growing small to medium businesses',
  29,
  'USD',
  'monthly',
  '["Unlimited products", "Up to 3 businesses", "Advanced analytics", "Multi-user access (3 users)", "API access", "Priority email support"]'::jsonb,
  3,
  NULL,
  3,
  10,
  TRUE
),
(
  'Pro Plus',
  'pro-plus',
  'For scaling businesses with advanced needs',
  79,
  'USD',
  'monthly',
  '["Unlimited products", "Unlimited businesses", "Advanced analytics with predictions", "Multi-user access (10 users)", "API access", "Custom integrations", "Phone & email support", "Automated reports"]'::jsonb,
  10,
  NULL,
  NULL,
  50,
  FALSE
),
(
  'Enterprise',
  'enterprise',
  'Custom solutions for large organizations',
  NULL,
  'USD',
  'yearly',
  '["Everything in Pro Plus", "Unlimited users", "Dedicated account manager", "Custom integrations", "SSO & advanced security", "Compliance support (HIPAA, SOC2)", "Phone & priority support", "Custom training"]'::jsonb,
  NULL,
  NULL,
  NULL,
  500,
  FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_business ON subscriptions(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_usage_user_business ON plan_usage(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);

-- Enable RLS on new tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans (publicly readable)
CREATE POLICY "Plans are viewable by all authenticated users"
  ON plans FOR SELECT
  USING (TRUE);

-- RLS policies for plan_usage (users can only see their own)
CREATE POLICY "Users can view their own plan usage"
  ON plan_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan usage"
  ON plan_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan usage"
  ON plan_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
