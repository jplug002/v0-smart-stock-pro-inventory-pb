-- Migration: Add social links and learning resource columns to user_preferences table
-- This script adds columns for social media URLs and learning resources

-- Add social media URL columns to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS youtube_tutorial_link TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN user_preferences.facebook_url IS 'Facebook page/profile URL for the user business';
COMMENT ON COLUMN user_preferences.instagram_url IS 'Instagram profile URL for the user business';
COMMENT ON COLUMN user_preferences.youtube_url IS 'YouTube channel URL for the user business';
COMMENT ON COLUMN user_preferences.tiktok_url IS 'TikTok profile URL for the user business';
COMMENT ON COLUMN user_preferences.youtube_tutorial_link IS 'YouTube tutorial link for learning how to use SmartStocks Pro';
