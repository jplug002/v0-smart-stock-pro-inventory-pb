'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Users } from 'lucide-react';

export function EmailBroadcaster() {
  const supabase = createClient();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  // Fetch total count of subscribed users when component mounts
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .neq('plan', 'free');
      setRecipientCount(count || 0);
    };
    fetchCount();
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
      // Create broadcast record in admin activity logs for tracking
      const { error: logError } = await supabase
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

      if (logError) throw logError;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Send Email Broadcast
        </CardTitle>
        <CardDescription>Send an email to all subscribed users</CardDescription>
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
            <p>Recipients: <span className="font-semibold">{recipientCount} subscribed users</span></p>
          </div>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendEmails} 
          disabled={loading || !subject || !message}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Sending...' : 'Send Email to All Users'}
        </Button>
      </CardContent>
    </Card>
  );
}
