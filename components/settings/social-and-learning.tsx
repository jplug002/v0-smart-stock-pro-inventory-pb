'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram, Youtube, Music } from 'lucide-react';

interface SocialLinksData {
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  youtube_tutorial_link: string;
}

export function SocialAndLearning() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<SocialLinksData>({
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    youtube_tutorial_link: '',
  });

  // Load existing links on mount
  useEffect(() => {
    const fetchLinks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('facebook_url, instagram_url, youtube_url, tiktok_url, youtube_tutorial_link')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setLinks({
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '',
          youtube_tutorial_link: data.youtube_tutorial_link || '',
        });
      }
    };

    fetchLinks();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ description: 'Please log in' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...links,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast({ description: 'Social links and learning resources updated successfully' });
    } catch (error: any) {
      toast({ description: error.message || 'Failed to save links', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SmartStocks Pro Social Links */}
      <Card className="p-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          SmartStocks Pro Social Links
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Share your business social media with your community
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Facebook className="w-4 h-4 inline mr-2" />
              Facebook URL
            </label>
            <Input
              type="url"
              placeholder="https://facebook.com/yourpage"
              value={links.facebook_url}
              onChange={(e) => setLinks({...links, facebook_url: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Instagram className="w-4 h-4 inline mr-2" />
              Instagram URL
            </label>
            <Input
              type="url"
              placeholder="https://instagram.com/yourprofile"
              value={links.instagram_url}
              onChange={(e) => setLinks({...links, instagram_url: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Youtube className="w-4 h-4 inline mr-2" />
              YouTube Channel URL
            </label>
            <Input
              type="url"
              placeholder="https://youtube.com/@yourchannel"
              value={links.youtube_url}
              onChange={(e) => setLinks({...links, youtube_url: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Music className="w-4 h-4 inline mr-2" />
              TikTok URL
            </label>
            <Input
              type="url"
              placeholder="https://tiktok.com/@yourprofile"
              value={links.tiktok_url}
              onChange={(e) => setLinks({...links, tiktok_url: e.target.value})}
            />
          </div>
        </div>
      </Card>

      {/* Learning Resources */}
      <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-950">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          Learning Resources
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Share your YouTube tutorial to help users learn how to use SmartStocks Pro
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            YouTube Tutorial Link
          </label>
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={links.youtube_tutorial_link}
            onChange={(e) => setLinks({...links, youtube_tutorial_link: e.target.value})}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Paste the full YouTube link to your tutorial video
          </p>
        </div>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? 'Saving...' : 'Save All Links'}
      </Button>
    </div>
  );
}
