-- Migration: Admin Real-time Tables
-- This script creates tables for email broadcasts and admin notifications
-- to support real-time admin dashboard features

-- ============================================
-- 1. Email Broadcasts Table
-- Stores all email broadcasts sent by admins
-- ============================================
CREATE TABLE IF NOT EXISTS email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'free', 'pro', 'pro_plus', 'enterprise', 'inactive'
  recipient_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sending', 'delivered', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on email_broadcasts
ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can view all email broadcasts
CREATE POLICY "Admin can view email broadcasts" ON email_broadcasts
  FOR SELECT
  USING (true);

-- Policy: Admin users can insert email broadcasts
CREATE POLICY "Admin can insert email broadcasts" ON email_broadcasts
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin users can update email broadcasts
CREATE POLICY "Admin can update email broadcasts" ON email_broadcasts
  FOR UPDATE
  USING (true);

-- ============================================
-- 2. Admin Push Notifications Table
-- Stores in-app notifications sent to users
-- ============================================
CREATE TABLE IF NOT EXISTS admin_push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'urgent'
  target_audience TEXT NOT NULL DEFAULT 'all',
  recipient_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_push_notifications
ALTER TABLE admin_push_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can view all push notifications
CREATE POLICY "Admin can view push notifications" ON admin_push_notifications
  FOR SELECT
  USING (true);

-- Policy: Admin users can insert push notifications
CREATE POLICY "Admin can insert push notifications" ON admin_push_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin users can update push notifications  
CREATE POLICY "Admin can update push notifications" ON admin_push_notifications
  FOR UPDATE
  USING (true);

-- ============================================
-- 3. Enable Realtime for all admin tables
-- ============================================

-- Enable realtime for subscriptions table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Enable realtime for paystack_transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE paystack_transactions;

-- Enable realtime for admin_activity_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_activity_logs;

-- Enable realtime for email_broadcasts table
ALTER PUBLICATION supabase_realtime ADD TABLE email_broadcasts;

-- Enable realtime for admin_push_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_push_notifications;

-- ============================================
-- 4. Create indexes for better query performance
-- ============================================

-- Index on email_broadcasts for filtering by status
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_status ON email_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_created_at ON email_broadcasts(created_at DESC);

-- Index on admin_push_notifications for filtering
CREATE INDEX IF NOT EXISTS idx_admin_push_notifications_status ON admin_push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_push_notifications_created_at ON admin_push_notifications(created_at DESC);

-- Index on paystack_transactions for admin queries
CREATE INDEX IF NOT EXISTS idx_paystack_transactions_created_at ON paystack_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paystack_transactions_status ON paystack_transactions(status);
