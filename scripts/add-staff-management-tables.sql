-- Create staff table for team management
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff', -- admin, manager, staff
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
CREATE POLICY "Users can view their own staff" ON staff
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own staff" ON staff
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staff" ON staff
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own staff" ON staff
  FOR DELETE USING (auth.uid() = user_id);

-- Create staff_permissions table for role-based access
CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, permission)
);

ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- RLS for staff_permissions
CREATE POLICY "Users can view their staff permissions" ON staff_permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = staff_permissions.staff_id AND staff.user_id = auth.uid())
  );

CREATE POLICY "Users can manage their staff permissions" ON staff_permissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = staff_permissions.staff_id AND staff.user_id = auth.uid())
  );

CREATE POLICY "Users can update their staff permissions" ON staff_permissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = staff_permissions.staff_id AND staff.user_id = auth.uid())
  );

CREATE POLICY "Users can delete their staff permissions" ON staff_permissions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = staff_permissions.staff_id AND staff.user_id = auth.uid())
  );
