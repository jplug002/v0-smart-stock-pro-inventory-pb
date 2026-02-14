-- Create user_pin table to store encrypted PIN for each user
CREATE TABLE IF NOT EXISTS user_pin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_pin ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own PIN record" ON user_pin
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PIN" ON user_pin
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PIN" ON user_pin
  FOR UPDATE USING (auth.uid() = user_id);

-- Create session_pin_verified table to track PIN verification status per session
CREATE TABLE IF NOT EXISTS session_pin_verified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE session_pin_verified ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own verification status" ON session_pin_verified
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification" ON session_pin_verified
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own verification" ON session_pin_verified
  FOR DELETE USING (auth.uid() = user_id);
