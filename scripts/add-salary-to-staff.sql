-- Add salary column to staff table if it doesn't exist
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2);

-- Removed problematic comment to fix SQL syntax error
