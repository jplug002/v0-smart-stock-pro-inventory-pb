-- Create salary_history table to track all salary changes
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  previous_salary NUMERIC NOT NULL,
  new_salary NUMERIC NOT NULL,
  increase_amount NUMERIC NOT NULL,
  increase_percentage NUMERIC,
  effective_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for salary_history
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for salary_history
CREATE POLICY "Users can view own salary history" ON salary_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create salary history" ON salary_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own salary history" ON salary_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own salary history" ON salary_history FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_salary_history_user_id ON salary_history(user_id);
CREATE INDEX idx_salary_history_staff_id ON salary_history(staff_id);
CREATE INDEX idx_salary_history_effective_date ON salary_history(effective_date);
