import React, { useState, useEffect } from 'react';
import { growthEngineAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Zap, RefreshCw, Loader2, Settings, Users, Target, TrendingUp,
  Save, Lightbulb, CheckCircle, Hash, MapPin, UserCheck, Eye,
  Heart, MessageCircle, UserPlus, BarChart3, Shield
} from 'lucide-react';

const AdminGrowthEngine = () => {
  const [config, setConfig] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editConfig, setEditConfig] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, campaignsRes, statsRes] = await Promise.all([
        growthEngineAPI.getConfig(),
        growthEngineAPI.getAllCampaigns(null, 50),
        growthEngineAPI.getEngineStats()
      ]);
      setConfig(configRes.data);
      setCampaigns(campaignsRes.data.campaigns || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await growthEngineAPI.updateConfig(editConfig);
      alert('Configuration saved!');
      setShowSettings(false);
      loadData();
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-growth-engine">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Engine</h1>
          <p className="text-gray-500">AI Targeting + Manual Actions (Safe Mode)</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setEditConfig({...config}); setShowSettings(true); }} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* How It Works Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-start gap-4">
          <Shield className="w-10 h-10 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Safe Growth System</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span><strong>Instagram Graph API</strong> for real analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <span><strong>AI Targeting</strong> suggests who to engage</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                <span><strong>Manual Actions</strong> by user (100% safe)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard icon={TrendingUp} label="Active Campaigns" value={stats?.active_campaigns || 0} color="from-green-500 to-emerald-500" />
        <StatCard icon={Users} label="Total Campaigns" value={stats?.total_campaigns || 0} color="from-blue-500 to-cyan-500" />
        <StatCard icon={Lightbulb} label="AI Suggestions" value={stats?.total_suggestions?.toLocaleString() || 0} color="from-purple-500 to-pink-500" />
        <StatCard icon={CheckCircle} label="Manual Actions" value={stats?.total_manual_actions?.toLocaleString() || 0} color="from-orange-500 to-red-500" />
        <StatCard icon={Zap} label="Today's Actions" value={stats?.today_manual_actions || 0} color="from-pink-500 to-rose-500" />
      </div>

      {/* Targeting Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          AI Targeting Configuration
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Daily Suggestions</p>
            <p className="text-2xl font-bold">{config?.daily_target_suggestions || 50}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Targeting Accuracy</p>
            <p className="text-2xl font-bold capitalize">{config?.targeting_accuracy || 'high'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Min Followers</p>
            <p className="text-2xl font-bold">{config?.min_follower_count || 100}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Max Followers</p>
            <p className="text-2xl font-bold">{(config?.max_follower_count || 50000).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-lg">All Growth Campaigns</h3>
        </div>
        {campaigns.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold">Account</th>
                <th className="text-left py-4 px-6 font-semibold">User</th>
                <th className="text-left py-4 px-6 font-semibold">Targeting</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-left py-4 px-6 font-semibold">Manual Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="font-medium">@{campaign.instagram_username}</p>
                    <p className="text-xs text-gray-400">{campaign.id.slice(0, 16)}...</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm">{campaign.user?.email || 'Unknown'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {campaign.target_hashtags?.slice(0, 2).map((tag, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-700 text-xs">
                          <Hash className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {campaign.target_locations?.slice(0, 1).map((loc, i) => (
                        <Badge key={i} className="bg-green-100 text-green-700 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {loc}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={
                      campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <UserPlus className="w-4 h-4" />
                        {campaign.stats?.manual_follows || 0}
                      </span>
                      <span className="flex items-center gap-1 text-pink-600">
                        <Heart className="w-4 h-4" />
                        {campaign.stats?.manual_likes || 0}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                        {campaign.stats?.manual_comments || 0}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No campaigns yet</p>
            <p className="text-sm text-gray-400 mt-2">Users create campaigns from their dashboard</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && editConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Growth Engine Settings</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium">Engine Active</span>
                  <p className="text-sm text-gray-500">Enable AI targeting suggestions</p>
                </div>
                <input
                  type="checkbox"
                  checked={editConfig.is_active}
                  onChange={(e) => setEditConfig({...editConfig, is_active: e.target.checked})}
                  className="w-6 h-6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Daily Target Suggestions</label>
                <Input
                  type="number"
                  value={editConfig.daily_target_suggestions || 50}
                  onChange={(e) => setEditConfig({...editConfig, daily_target_suggestions: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">AI suggestions per user per day</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Targeting Accuracy</label>
                <select
                  value={editConfig.targeting_accuracy || 'high'}
                  onChange={(e) => setEditConfig({...editConfig, targeting_accuracy: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low (More suggestions, broader)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Fewer, more targeted)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Followers</label>
                  <Input
                    type="number"
                    value={editConfig.min_follower_count || 100}
                    onChange={(e) => setEditConfig({...editConfig, min_follower_count: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Followers</label>
                  <Input
                    type="number"
                    value={editConfig.max_follower_count || 50000}
                    onChange={(e) => setEditConfig({...editConfig, max_follower_count: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Min Engagement Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editConfig.min_engagement_rate || 1.0}
                  onChange={(e) => setEditConfig({...editConfig, min_engagement_rate: parseFloat(e.target.value)})}
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Exclude Private Accounts</span>
                <input
                  type="checkbox"
                  checked={editConfig.exclude_private_accounts}
                  onChange={(e) => setEditConfig({...editConfig, exclude_private_accounts: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>

              <Button onClick={handleSaveConfig} disabled={saving} className="w-full bg-pink-500 hover:bg-pink-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default AdminGrowthEngine;
