'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  resource_type: string;
  admin_id: string;
  details: Record<string, any>;
  created_at: string;
}

export function ActivityLogsViewer() {
  const supabase = createClient();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch activity logs on component mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs(data || []);
      } catch (error: any) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format action name for display
  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get action color based on action type
  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
    if (action.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
    if (action.includes('send')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Admin Activity Logs
        </CardTitle>
        <CardDescription>View recent admin actions and system events</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No activity logs found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {log.resource_type}
                      </span>
                    </div>
                    
                    {/* Details Preview */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-md">
                        {Object.entries(log.details)
                          .slice(0, 2)
                          .map(([key, value]) => `${key}: ${String(value).substring(0, 20)}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                      {log.admin_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
