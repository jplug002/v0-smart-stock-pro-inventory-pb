import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.SUPABASE_POSTGRES_URL || "")

async function runMigrations() {
  try {
    console.log("[v0] Starting database migrations...")

    // Read and execute the first migration
    const createTablesSQL = `
-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit_price DECIMAL(10, 2) NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  payment_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity_sold INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
    `

    console.log("[v0] Creating tables...")
    await sql(createTablesSQL)
    console.log("[v0] Tables created successfully!")

    // Enable RLS
    const enableRLSSQL = `
-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Products: Allow all authenticated users to view and manage
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert products"
  ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update products"
  ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete products"
  ON public.products FOR DELETE
  USING (auth.role() = 'authenticated');

-- Suppliers: Allow all authenticated users to view and manage
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete suppliers"
  ON public.suppliers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sales: Allow all authenticated users to view and manage
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view sales"
  ON public.sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update sales"
  ON public.sales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete sales"
  ON public.sales FOR DELETE
  USING (auth.role() = 'authenticated');

-- Expenses: Allow all authenticated users to view and manage
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view expenses"
  ON public.expenses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update expenses"
  ON public.expenses FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete expenses"
  ON public.expenses FOR DELETE
  USING (auth.role() = 'authenticated');

-- Notifications: Allow all authenticated users to view and manage
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view notifications"
  ON public.notifications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update notifications"
  ON public.notifications FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete notifications"
  ON public.notifications FOR DELETE
  USING (auth.role() = 'authenticated');
    `

    console.log("[v0] Enabling RLS and creating policies...")
    await sql(enableRLSSQL)
    console.log("[v0] RLS policies created successfully!")

    console.log("[v0] All migrations completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    process.exit(1)
  }
}

runMigrations()
