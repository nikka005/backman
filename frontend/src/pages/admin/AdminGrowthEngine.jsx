import React, { useState, useEffect } from 'react';
import { growthEngineAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Zap, RefreshCw, Loader2, Settings, Play, Pause, Users, Heart,
  UserPlus, UserMinus, MessageCircle, Eye, TrendingUp, Save, AlertCircle
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

  const handlePauseCampaign = async (campaignId) => {
    try {
      await growthEngineAPI.pauseCampaign(campaignId);
      loadData();
    } catch (error) {
      alert('Failed to pause campaign');
    }
  };

  const handleResumeCampaign = async (campaignId) => {
    try {
      await growthEngineAPI.resumeCampaign(campaignId);
      loadData();
    } catch (error) {
      alert('Failed to resume campaign');
    }
  };

  const handleExecuteBatch = async () => {
    if (!confirm('Execute growth actions for all active campaigns?')) return;
    try {
      const result = await growthEngineAPI.executeBatch();
      alert(`Executed ${result.data.actions_count} actions!`);
      loadData();
    } catch (error) {
      alert('Failed to execute batch');
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
          <p className="text-gray-500">Instagram growth automation management</p>
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

      {/* Status Banner */}
      <div className={`rounded-xl p-6 mb-8 ${config?.is_active ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-500'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8" />
            <div>
              <h3 className="font-semibold text-lg">Growth Engine {config?.is_active ? 'Active' : 'Inactive'}</h3>
              <p className="text-white/80">Provider: {config?.api_provider || 'Internal'} | Targeting: {config?.targeting_accuracy}</p>
            </div>
          </div>
          <Button
            onClick={handleExecuteBatch}
            className="bg-white text-green-600 hover:bg-white/90"
            disabled={!config?.is_active}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Batch Actions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Active Campaigns"
          value={stats?.active_campaigns || 0}
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={Pause}
          label="Paused"
          value={stats?.paused_campaigns || 0}
          color="from-yellow-500 to-orange-500"
        />
        <StatCard
          icon={Zap}
          label="Total Actions"
          value={stats?.total_actions?.toLocaleString() || 0}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={Zap}
          label="Today's Actions"
          value={stats?.today_actions || 0}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Users}
          label="Total Campaigns"
          value={stats?.total_campaigns || 0}
          color="from-pink-500 to-rose-500"
        />
      </div>

      {/* Daily Limits */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-lg mb-4">Daily Action Limits</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LimitCard icon={UserPlus} label="Follows" value={config?.daily_follow_limit || 200} color="text-green-500" />
          <LimitCard icon={UserMinus} label="Unfollows" value={config?.daily_unfollow_limit || 100} color="text-red-500" />
          <LimitCard icon={Heart} label="Likes" value={config?.daily_like_limit || 500} color="text-pink-500" />
          <LimitCard icon={MessageCircle} label="Comments" value={config?.daily_comment_limit || 50} color="text-blue-500" />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-lg">All Campaigns</h3>
        </div>
        {campaigns.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold">Account</th>
                <th className="text-left py-4 px-6 font-semibold">User</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-left py-4 px-6 font-semibold">Speed</th>
                <th className="text-left py-4 px-6 font-semibold">Stats</th>
                <th className="text-left py-4 px-6 font-semibold">Actions</th>
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
                    <Badge className={
                      campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 capitalize">{campaign.growth_speed}</td>
                  <td className="py-4 px-6">
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-600">{campaign.stats?.total_follows || 0} follows</span>
                      <span className="text-pink-600">{campaign.stats?.total_likes || 0} likes</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {campaign.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => handlePauseCampaign(campaign.id)}>
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : campaign.status === 'paused' ? (
                      <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleResumeCampaign(campaign.id)}>
                        <Play className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No campaigns yet</p>
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
              <div className="flex items-center justify-between">
                <span className="font-medium">Engine Active</span>
                <input
                  type="checkbox"
                  checked={editConfig.is_active}
                  onChange={(e) => setEditConfig({...editConfig, is_active: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">API Provider</label>
                <select
                  value={editConfig.api_provider}
                  onChange={(e) => setEditConfig({...editConfig, api_provider: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="internal">Internal Engine</option>
                  <option value="socialbee">SocialBee</option>
                  <option value="kicksta">Kicksta</option>
                  <option value="custom">Custom API</option>
                </select>
              </div>

              {editConfig.api_provider === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Endpoint</label>
                    <Input
                      value={editConfig.api_endpoint || ''}
                      onChange={(e) => setEditConfig({...editConfig, api_endpoint: e.target.value})}
                      placeholder="https://api.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <Input
                      type="password"
                      value={editConfig.api_key || ''}
                      onChange={(e) => setEditConfig({...editConfig, api_key: e.target.value})}
                      placeholder="Enter API key"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Targeting Accuracy</label>
                <select
                  value={editConfig.targeting_accuracy}
                  onChange={(e) => setEditConfig({...editConfig, targeting_accuracy: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low (Faster, less targeted)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Slower, more targeted)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Follow Limit</label>
                  <Input
                    type="number"
                    value={editConfig.daily_follow_limit}
                    onChange={(e) => setEditConfig({...editConfig, daily_follow_limit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Unfollow Limit</label>
                  <Input
                    type="number"
                    value={editConfig.daily_unfollow_limit}
                    onChange={(e) => setEditConfig({...editConfig, daily_unfollow_limit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Like Limit</label>
                  <Input
                    type="number"
                    value={editConfig.daily_like_limit}
                    onChange={(e) => setEditConfig({...editConfig, daily_like_limit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Comment Limit</label>
                  <Input
                    type="number"
                    value={editConfig.daily_comment_limit}
                    onChange={(e) => setEditConfig({...editConfig, daily_comment_limit: parseInt(e.target.value)})}
                  />
                </div>
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

const LimitCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
    <Icon className={`w-6 h-6 ${color}`} />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}/day</p>
    </div>
  </div>
);

export default AdminGrowthEngine;
