'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Users, History, RefreshCw } from 'lucide-react';

// Type for email broadcast records
interface EmailBroadcast {
  id: string;
  subject: string;
  message: string;
  recipient_count: number;
  status: string;
  sent_at: string;
  created_at: string;
}

export function EmailBroadcaster() {
  const supabase = createClient();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [recentBroadcasts, setRecentBroadcasts] = useState<EmailBroadcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch total count of subscribed users and recent broadcasts
  useEffect(() => {
    const fetchData = async () => {
      // Fetch recipient count (all users, not just premium)
      const { count } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' });
      setRecipientCount(count || 0);

      // Fetch recent email broadcasts
      const { data: broadcasts } = await supabase
        .from('email_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentBroadcasts(broadcasts || []);
      setLoadingHistory(false);
    };

    fetchData();

    // Set up real-time subscription for email_broadcasts
    const channel = supabase
      .channel('email_broadcasts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'email_broadcasts' },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'INSERT') {
            setRecentBroadcasts((prev) => [payload.new as EmailBroadcast, ...prev.slice(0, 4)]);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendEmails = async () => {
    // Validate inputs
    if (!subject.trim()) {
      toast({ description: 'Please enter an email subject', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ description: 'Please enter an email message', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ description: 'Please log in', variant: 'destructive' });
      setLoading(false);
      return;
    }

    try {
      // Insert into email_broadcasts table
      const { error: broadcastError } = await supabase
        .from('email_broadcasts')
        .insert({
          admin_id: user.id,
          subject,
          message,
          recipient_count: recipientCount,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (broadcastError) throw broadcastError;

      // Also log in activity logs for audit trail
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action: 'send_email_broadcast',
          resource_type: 'email_broadcast',
          details: {
            subject,
            message_preview: message.substring(0, 100),
            recipient_count: recipientCount
          },
          ip_address: 'system'
        });

      // Clear form and show success
      toast({ description: `Email broadcast sent to ${recipientCount} users` });
      setSubject('');
      setMessage('');
    } catch (error: any) {
      toast({ description: error.message || 'Failed to send emails', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Email Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Email Broadcast
          </CardTitle>
          <CardDescription>Send an email to all registered users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Subject
            </label>
            <Input
              placeholder="e.g., New Feature Update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Message
            </label>
            <Textarea
              placeholder="Enter your email message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={6}
            />
          </div>

          {/* Recipient Count */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
            <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
              <Users className="w-4 h-4" />
              <p>Recipients: <span className="font-semibold">{recipientCount} users</span></p>
            </div>
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSendEmails} 
            disabled={loading || !subject || !message}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Email to All Users'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Broadcasts History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Recent Broadcasts
          </CardTitle>
          <CardDescription>Last 5 email broadcasts sent</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <p className="text-sm text-gray-500">Loading history...</p>
          ) : recentBroadcasts.length === 0 ? (
            <p className="text-sm text-gray-500">No broadcasts sent yet</p>
          ) : (
            <div className="space-y-3">
              {recentBroadcasts.map((broadcast) => (
                <div 
                  key={broadcast.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{broadcast.subject}</p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {broadcast.message.substring(0, 60)}...
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatDate(broadcast.created_at)}</p>
                      <p className="text-xs text-green-600 mt-1">{broadcast.recipient_count} sent</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
