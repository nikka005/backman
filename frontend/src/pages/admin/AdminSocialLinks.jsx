import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { 
  Instagram, Twitter, Linkedin, Youtube, Facebook, 
  Save, Loader2, ExternalLink, RefreshCw, Share2
} from 'lucide-react';
import api from '../../services/api';

// TikTok icon component
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// Pinterest icon component
const PinterestIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

// Discord icon component
const DiscordIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
  </svg>
);

// Telegram icon component
const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', placeholder: 'https://instagram.com/yourusername' },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-sky-500', placeholder: 'https://twitter.com/yourusername' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', placeholder: 'https://facebook.com/yourpage' },
  { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, color: 'text-black', placeholder: 'https://tiktok.com/@yourusername' },
  { key: 'pinterest', label: 'Pinterest', icon: PinterestIcon, color: 'text-red-600', placeholder: 'https://pinterest.com/yourusername' },
  { key: 'discord', label: 'Discord', icon: DiscordIcon, color: 'text-indigo-500', placeholder: 'https://discord.gg/yourinvite' },
  { key: 'telegram', label: 'Telegram', icon: TelegramIcon, color: 'text-sky-400', placeholder: 'https://t.me/yourchannel' },
];

export default function AdminSocialLinks() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState({});

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/social-links');
      setLinks(response.data || {});
    } catch (error) {
      console.error('Failed to load social links:', error);
      toast.error('Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings/social-links', links);
      toast.success('Social links saved successfully!');
    } catch (error) {
      console.error('Failed to save social links:', error);
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (key, value) => {
    setLinks(prev => ({ ...prev, [key]: value }));
  };

  const openLink = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const activeLinksCount = Object.values(links).filter(v => v && v.trim()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="social-links-loading">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-social-links">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-7 h-7 text-pink-500" />
            Social Media Links
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your social media presence across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSocialLinks} data-testid="refresh-social-links">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving} data-testid="save-social-links">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Links</p>
                <p className="text-2xl font-bold text-green-500">{activeLinksCount}</p>
              </div>
              <Share2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Platforms</p>
                <p className="text-2xl font-bold">{SOCIAL_PLATFORMS.length}</p>
              </div>
              <ExternalLink className="w-8 h-8 text-gray-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Links Form */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Profiles</CardTitle>
          <CardDescription>
            Add your social media URLs below. These links will appear in the footer and other areas of your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOCIAL_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const value = links[platform.key] || '';
              const hasValue = value && value.trim();
              
              return (
                <div key={platform.key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${platform.color}`} />
                    {platform.label}
                    {hasValue && (
                      <span className="text-xs text-green-500 font-normal">(Active)</span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder={platform.placeholder}
                      value={value}
                      onChange={(e) => updateLink(platform.key, e.target.value)}
                      className="flex-1"
                      data-testid={`social-link-${platform.key}`}
                    />
                    {hasValue && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openLink(value)}
                        title={`Open ${platform.label}`}
                        data-testid={`open-link-${platform.key}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            This is how your social links will appear in the footer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center gap-3 flex-wrap">
              {SOCIAL_PLATFORMS.filter(p => links[p.key] && links[p.key].trim()).map(platform => {
                const Icon = platform.icon;
                return (
                  <a
                    key={platform.key}
                    href={links[platform.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors text-gray-300 hover:text-white"
                    title={platform.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
              {activeLinksCount === 0 && (
                <p className="text-gray-500 text-sm">No social links configured yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
