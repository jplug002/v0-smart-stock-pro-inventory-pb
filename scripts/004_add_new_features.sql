-- Add new tables for advanced features

-- Create warehouses table for multi-warehouse support
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse_inventory table to track inventory by warehouse
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, warehouse_id)
);

-- Create batches table for batch/lot tracking
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity_received INTEGER NOT NULL,
  quantity_available INTEGER NOT NULL,
  manufacturing_date DATE,
  expiration_date DATE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, batch_number, warehouse_id)
);

-- Create sales_forecasts table for demand planning
CREATE TABLE IF NOT EXISTS public.sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  moving_average_7d DECIMAL(10, 2),
  moving_average_30d DECIMAL(10, 2),
  seasonal_factor DECIMAL(5, 2),
  trend_value DECIMAL(10, 2),
  predicted_demand INTEGER,
  confidence_level DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, forecast_date)
);

-- Create import_exports table to track data imports/exports
CREATE TABLE IF NOT EXISTS public.import_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'import' or 'export'
  module TEXT NOT NULL, -- 'products', 'sales', 'suppliers', 'expenses'
  file_name TEXT NOT NULL,
  file_url TEXT,
  row_count INTEGER,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create product_barcodes table for barcode tracking
CREATE TABLE IF NOT EXISTS public.product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode_value TEXT UNIQUE NOT NULL,
  barcode_format TEXT DEFAULT 'CODE128', -- 'CODE128', 'EAN13', 'UPC', etc.
  barcode_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product_id ON public.warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse_id ON public.warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON public.batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_id ON public.batches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiration_date ON public.batches(expiration_date);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_product_id ON public.sales_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_forecast_date ON public.sales_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_product_id ON public.product_barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode_value ON public.product_barcodes(barcode_value);

-- Enable RLS on new tables
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warehouses
CREATE POLICY "Allow authenticated users to view warehouses"
  ON public.warehouses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert warehouses"
  ON public.warehouses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update warehouses"
  ON public.warehouses FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete warehouses"
  ON public.warehouses FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create RLS policies for warehouse_inventory
CREATE POLICY "Allow authenticated users to view warehouse_inventory"
  ON public.warehouse_inventory FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert warehouse_inventory"
  ON public.warehouse_inventory FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update warehouse_inventory"
  ON public.warehouse_inventory FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete warehouse_inventory"
  ON public.warehouse_inventory FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create RLS policies for batches
CREATE POLICY "Allow authenticated users to view batches"
  ON public.batches FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert batches"
  ON public.batches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update batches"
  ON public.batches FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete batches"
  ON public.batches FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create RLS policies for sales_forecasts
CREATE POLICY "Allow authenticated users to view sales_forecasts"
  ON public.sales_forecasts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sales_forecasts"
  ON public.sales_forecasts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sales_forecasts"
  ON public.sales_forecasts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sales_forecasts"
  ON public.sales_forecasts FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create RLS policies for import_exports
CREATE POLICY "Allow authenticated users to view import_exports"
  ON public.import_exports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert import_exports"
  ON public.import_exports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update import_exports"
  ON public.import_exports FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete import_exports"
  ON public.import_exports FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create RLS policies for product_barcodes
CREATE POLICY "Allow authenticated users to view product_barcodes"
  ON public.product_barcodes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert product_barcodes"
  ON public.product_barcodes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product_barcodes"
  ON public.product_barcodes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product_barcodes"
  ON public.product_barcodes FOR DELETE
  USING (auth.role() = 'authenticated');
