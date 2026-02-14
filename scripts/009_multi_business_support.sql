-- =====================================================
-- Multi-Business Support Migration
-- This script adds support for users to manage multiple businesses
-- =====================================================

-- Step 1: Add is_default column to businesses table to track the default/active business
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Step 2: Add business_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 3: Add business_id to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 4: Add business_id to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 5: Add business_id to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 6: Add business_id to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 7: Add business_id to batches table
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 8: Add business_id to pos_transactions table
ALTER TABLE pos_transactions 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 9: Add business_id to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Step 10: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_id ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);

-- Step 11: Remove old unique constraint on businesses if exists and add new one
-- This allows multiple businesses per user
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_user_id_key') THEN
        ALTER TABLE businesses DROP CONSTRAINT businesses_user_id_key;
    END IF;
END $$;

-- Step 12: Update RLS policies for businesses to allow multiple businesses
DROP POLICY IF EXISTS "Users can view own business" ON businesses;
CREATE POLICY "Users can view own businesses" ON businesses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business" ON businesses;
CREATE POLICY "Users can insert own businesses" ON businesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business" ON businesses;
CREATE POLICY "Users can update own businesses" ON businesses
    FOR UPDATE USING (auth.uid() = user_id);

-- Add delete policy for businesses
DROP POLICY IF EXISTS "Users can delete own businesses" ON businesses;
CREATE POLICY "Users can delete own businesses" ON businesses
    FOR DELETE USING (auth.uid() = user_id);
