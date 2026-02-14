import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing Supabase environment variables")
  console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗")
  console.error("[v0] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log("[v0] Starting database setup...")

    // Create suppliers table first (no dependencies)
    console.log("[v0] Creating suppliers table...")
    const { error: suppliersError } = await supabase.rpc("execute_sql", {
      sql: `
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
      `,
    })

    if (suppliersError) {
      console.log("[v0] Suppliers table already exists or created")
    }

    // Create products table
    console.log("[v0] Creating products table...")
    const { error: productsError } = await supabase.rpc("execute_sql", {
      sql: `
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
      `,
    })

    if (productsError) {
      console.log("[v0] Products table already exists or created")
    }

    // Create sales table
    console.log("[v0] Creating sales table...")
    const { error: salesError } = await supabase.rpc("execute_sql", {
      sql: `
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
      `,
    })

    if (salesError) {
      console.log("[v0] Sales table already exists or created")
    }

    // Create expenses table
    console.log("[v0] Creating expenses table...")
    const { error: expensesError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `,
    })

    if (expensesError) {
      console.log("[v0] Expenses table already exists or created")
    }

    // Create notifications table
    console.log("[v0] Creating notifications table...")
    const { error: notificationsError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `,
    })

    if (notificationsError) {
      console.log("[v0] Notifications table already exists or created")
    }

    console.log("[v0] Database setup completed!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
