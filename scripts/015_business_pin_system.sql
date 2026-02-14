-- Add PIN column to businesses table for business-level security
-- Each business can have its own 4-digit PIN for access control

-- Step 1: Add pin_hash column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Step 2: Create index for faster PIN lookups
CREATE INDEX IF NOT EXISTS idx_businesses_pin_hash ON businesses(pin_hash) WHERE pin_hash IS NOT NULL;

-- Step 3: Add comment to document the column purpose
COMMENT ON COLUMN businesses.pin_hash IS 'SHA-256 hashed 4-digit PIN for business access security';
