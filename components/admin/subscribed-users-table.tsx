'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface SubscribedUser {
  id: string;
  user_id: string;
  plan: string;
  billing_cycle: string;
  status: string;
  start_date: string;
  expiry_date: string;
}

export function SubscribedUsersTable() {
  const supabase = createClient();
  const [users, setUsers] = useState<SubscribedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch subscribed users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            id,
            user_id,
            plan,
            billing_cycle,
            status,
            start_date,
            expiry_date
          `)
          .neq('plan', 'free')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setUsers(data || []);
      } catch (error: any) {
        console.error('Error fetching subscribed users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'pro_plus':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
      case 'enterprise':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Subscribed Users
        </CardTitle>
        <CardDescription>View all users with active paid subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No subscribed users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">User ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Plan</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Billing</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {user.user_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPlanBadgeColor(user.plan)}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-gray-700 dark:text-gray-300">
                      {user.billing_cycle}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 rounded text-xs font-medium capitalize">
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {formatDate(user.start_date)}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {formatDate(user.expiry_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
