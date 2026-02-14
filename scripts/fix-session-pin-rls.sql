-- Add missing UPDATE policy for session_pin_verified table
CREATE POLICY "Users can update own verification" ON session_pin_verified
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
