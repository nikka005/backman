import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { growthEngineAPI, subscriptionAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Zap, Target, Lightbulb, Users, TrendingUp, Plus, RefreshCw,
  Loader2, CheckCircle, Hash, MapPin, UserPlus, Heart, MessageCircle,
  Eye, BarChart3, Shield, Sparkles, ChevronRight, Play, Pause,
  X, ArrowRight, AlertCircle
} from 'lucide-react';

const GrowthEnginePage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    instagram_username: '',
    target_hashtags: '',
    target_locations: '',
    competitor_accounts: '',
    target_niches: '',
    daily_target: 30
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check subscription
      const subRes = await subscriptionAPI.getCurrent();
      setHasSubscription(subRes.data?.status === 'active');
      
      // Load campaigns
      const campaignsRes = await growthEngineAPI.getCampaigns();
      setCampaigns(campaignsRes.data.campaigns || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const campaignData = {
        instagram_username: newCampaign.instagram_username,
        target_hashtags: newCampaign.target_hashtags.split(',').map(t => t.trim()).filter(Boolean),
        target_locations: newCampaign.target_locations.split(',').map(t => t.trim()).filter(Boolean),
        competitor_accounts: newCampaign.competitor_accounts.split(',').map(t => t.trim()).filter(Boolean),
        target_niches: newCampaign.target_niches.split(',').map(t => t.trim()).filter(Boolean),
        daily_target: parseInt(newCampaign.daily_target)
      };
      
      await growthEngineAPI.startCampaign(campaignData);
      setShowNewCampaign(false);
      setNewCampaign({
        instagram_username: '',
        target_hashtags: '',
        target_locations: '',
        competitor_accounts: '',
        target_niches: '',
        daily_target: 30
      });
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create campaign');
    }
  };

  const loadSuggestions = async (campaignId) => {
    try {
      setLoadingSuggestions(true);
      setSelectedCampaign(campaignId);
      const res = await growthEngineAPI.getCampaignSuggestions(campaignId, 10);
      setSuggestions(res.data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleCampaign = async (campaignId, action) => {
    try {
      if (action === 'pause') {
        await growthEngineAPI.pauseCampaign(campaignId);
      } else {
        await growthEngineAPI.resumeCampaign(campaignId);
      }
      loadData();
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg text-center shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Unlock Growth Engine</h2>
          <p className="text-gray-600 mb-6">
            Subscribe to access AI-powered targeting suggestions and grow your Instagram organically.
          </p>
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="growth-engine-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Growth Engine</h1>
              <p className="mt-2 text-pink-100">AI-powered targeting for organic Instagram growth</p>
            </div>
            <Button 
              onClick={() => setShowNewCampaign(true)}
              className="bg-white text-pink-600 hover:bg-pink-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* How It Works */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            How It Works (100% Safe)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Real Analytics</p>
                <p className="text-sm text-gray-500">Track your growth with Instagram Graph API data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">AI Suggestions</p>
                <p className="text-sm text-gray-500">Get smart recommendations on who to engage with</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Manual Actions</p>
                <p className="text-sm text-gray-500">You engage manually - no automation, no risk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Campaigns Yet</h3>
            <p className="text-gray-500 mb-6">Create your first targeting campaign to start getting AI suggestions</p>
            <Button 
              onClick={() => setShowNewCampaign(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">@{campaign.instagram_username}</h3>
                        <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCampaign(campaign.id, campaign.status === 'active' ? 'pause' : 'resume')}
                    >
                      {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Targeting Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {campaign.target_hashtags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} className="bg-blue-50 text-blue-700">
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {campaign.target_niches?.slice(0, 2).map((niche, i) => (
                      <Badge key={i} className="bg-purple-50 text-purple-700">
                        {niche}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{campaign.stats?.total_suggestions_generated || 0}</p>
                      <p className="text-xs text-gray-500">Suggestions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{campaign.stats?.manual_follows || 0}</p>
                      <p className="text-xs text-gray-500">Follows</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-pink-600">{campaign.stats?.manual_likes || 0}</p>
                      <p className="text-xs text-gray-500">Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{campaign.stats?.manual_comments || 0}</p>
                      <p className="text-xs text-gray-500">Comments</p>
                    </div>
                  </div>

                  {/* Get Suggestions Button */}
                  <Button
                    onClick={() => loadSuggestions(campaign.id)}
                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600"
                    disabled={loadingSuggestions && selectedCampaign === campaign.id}
                  >
                    {loadingSuggestions && selectedCampaign === campaign.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Get AI Suggestions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Suggestions Modal/Section */}
        {suggestions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <h3 className="font-semibold text-lg">AI Targeting Suggestions</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSuggestions([])}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Manual Engagement Required</p>
                    <p className="text-sm text-yellow-700">
                      These are AI suggestions. Go to Instagram and engage with these accounts manually to stay safe and compliant.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="border rounded-xl p-4 hover:border-pink-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {suggestion.priority} priority
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{suggestion.account_type}</h4>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.search_strategy}</p>
                        
                        {suggestion.hashtags_to_explore?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {suggestion.hashtags_to_explore.map((tag, i) => (
                              <Badge key={i} className="bg-blue-50 text-blue-700 text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-700">
                            <strong>Tip:</strong> {suggestion.engagement_tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCampaign(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Growth Campaign</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNewCampaign(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Instagram Username *</label>
                <Input
                  value={newCampaign.instagram_username}
                  onChange={(e) => setNewCampaign({...newCampaign, instagram_username: e.target.value})}
                  placeholder="your_username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Hashtags</label>
                <Input
                  value={newCampaign.target_hashtags}
                  onChange={(e) => setNewCampaign({...newCampaign, target_hashtags: e.target.value})}
                  placeholder="fitness, motivation, gym (comma separated)"
                />
                <p className="text-xs text-gray-500 mt-1">Hashtags your ideal followers use</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Niches</label>
                <Input
                  value={newCampaign.target_niches}
                  onChange={(e) => setNewCampaign({...newCampaign, target_niches: e.target.value})}
                  placeholder="Fitness, Health, Lifestyle"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Competitor Accounts</label>
                <Input
                  value={newCampaign.competitor_accounts}
                  onChange={(e) => setNewCampaign({...newCampaign, competitor_accounts: e.target.value})}
                  placeholder="competitor1, competitor2"
                />
                <p className="text-xs text-gray-500 mt-1">Similar accounts whose followers might like you</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Locations</label>
                <Input
                  value={newCampaign.target_locations}
                  onChange={(e) => setNewCampaign({...newCampaign, target_locations: e.target.value})}
                  placeholder="New York, Los Angeles"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Daily Suggestions Target</label>
                <Input
                  type="number"
                  value={newCampaign.daily_target}
                  onChange={(e) => setNewCampaign({...newCampaign, daily_target: e.target.value})}
                  min={10}
                  max={100}
                />
              </div>
              
              <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600">
                <Zap className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthEnginePage;
