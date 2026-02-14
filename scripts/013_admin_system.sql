-- Admin dashboard schema with users stats, payments, activity logs, and admin roles
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  login_status TEXT CHECK (login_status IN ('success', 'failed'))
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_id TEXT,
  invoice_number TEXT UNIQUE,
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL UNIQUE,
  max_products INTEGER,
  max_staff INTEGER,
  max_suppliers INTEGER,
  max_businesses INTEGER,
  max_users_per_business INTEGER,
  max_api_calls_per_month INTEGER,
  export_limit_per_month INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin users can view admin_users" 
  ON admin_users FOR SELECT 
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Super admin can manage admin_users"
  ON admin_users FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin'));

CREATE POLICY "Admin can view activity logs"
  ON admin_activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Admin can insert activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Admin can view user login logs"
  ON user_login_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "System can insert login logs"
  ON user_login_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view payments"
  ON payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "System can manage payments"
  ON payments FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true));

CREATE POLICY "Anyone can view plan_limits"
  ON plan_limits FOR SELECT
  USING (true);

CREATE POLICY "Super admin can manage plan_limits"
  ON plan_limits FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin'));

-- Insert default plan limits
INSERT INTO plan_limits (plan, max_products, max_staff, max_suppliers, max_businesses, max_users_per_business, max_api_calls_per_month, export_limit_per_month)
VALUES 
  ('free', 10, 1, 5, 1, 1, 1000, 5),
  ('pro', 100, 10, 50, 3, 5, 10000, 50),
  ('pro_plus', 500, 50, 200, 10, 20, 100000, 500),
  ('enterprise', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (plan) DO NOTHING;

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX idx_user_login_logs_created_at ON user_login_logs(login_timestamp);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
