-- Multi-Business Data Separation Migration
-- This script adds business_id to core tables for data isolation per business

-- Add business_id column to products table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE products ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add business_id column to sales table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add business_id column to expenses table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE expenses ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add business_id column to categories table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add business_id column to suppliers table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_id ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON suppliers(business_id);

-- Update existing data to link to the user's first business (if exists)
-- This preserves existing data while enabling multi-business support
DO $$
DECLARE
    user_record RECORD;
    first_business_id UUID;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM products WHERE business_id IS NULL
    LOOP
        -- Get the first business for this user
        SELECT id INTO first_business_id 
        FROM businesses 
        WHERE user_id = user_record.user_id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Update products for this user
        IF first_business_id IS NOT NULL THEN
            UPDATE products SET business_id = first_business_id 
            WHERE user_id = user_record.user_id AND business_id IS NULL;
        END IF;
    END LOOP;

    FOR user_record IN SELECT DISTINCT user_id FROM sales WHERE business_id IS NULL
    LOOP
        SELECT id INTO first_business_id 
        FROM businesses 
        WHERE user_id = user_record.user_id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF first_business_id IS NOT NULL THEN
            UPDATE sales SET business_id = first_business_id 
            WHERE user_id = user_record.user_id AND business_id IS NULL;
        END IF;
    END LOOP;

    FOR user_record IN SELECT DISTINCT user_id FROM expenses WHERE business_id IS NULL
    LOOP
        SELECT id INTO first_business_id 
        FROM businesses 
        WHERE user_id = user_record.user_id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF first_business_id IS NOT NULL THEN
            UPDATE expenses SET business_id = first_business_id 
            WHERE user_id = user_record.user_id AND business_id IS NULL;
        END IF;
    END LOOP;
END $$;

-- Add RLS policies for business data isolation
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Sales policies
DROP POLICY IF EXISTS "Users can view own sales" ON sales;
DROP POLICY IF EXISTS "Users can insert own sales" ON sales;
DROP POLICY IF EXISTS "Users can update own sales" ON sales;
DROP POLICY IF EXISTS "Users can delete own sales" ON sales;

CREATE POLICY "Users can view own sales" ON sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales" ON sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales" ON sales
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales" ON sales
    FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);
