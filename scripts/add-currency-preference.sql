-- Add currency column to user_preferences table
ALTER TABLE user_preferences ADD COLUMN currency TEXT DEFAULT 'GHS';

-- Set existing users to GHS as default
UPDATE user_preferences SET currency = 'GHS' WHERE currency IS NULL;
