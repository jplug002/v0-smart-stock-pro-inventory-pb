-- Grant admin access to a user
-- Replace 'your-email@example.com' with your actual email address

-- Step 1: Find your user_id from the auth.users table
-- This will display your user_id that you'll need for the next step
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Updated to use is_active instead of status to match admin_users table schema
-- Step 2: Insert admin role for your user
-- Replace 'YOUR_USER_ID_HERE' with the id from Step 1
INSERT INTO public.admin_users (user_id, role, is_active)
VALUES ('YOUR_USER_ID_HERE', 'super_admin', true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = now();

-- Verify the admin access was granted
SELECT 
  au.id,
  au.user_id,
  au.role,
  au.is_active,
  u.email
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE au.user_id = 'YOUR_USER_ID_HERE';

-- Now you can access the admin dashboard at /admin
