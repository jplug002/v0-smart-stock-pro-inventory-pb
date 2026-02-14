-- Add cost_price column to products table for proper profit calculation
-- This allows users to track both the purchase cost and selling price

-- Adding cost_price column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;

-- Update existing products to have cost_price = 0 (user should update these)
UPDATE products SET cost_price = 0 WHERE cost_price IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN products.cost_price IS 'The purchase/cost price of the product for profit calculations';

-- Adding product_id column to expenses table for linking expenses to products
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_product_id ON expenses(product_id);

-- Add comment explaining the field
COMMENT ON COLUMN expenses.product_id IS 'Optional link to a product for product-related expenses like restocking';
