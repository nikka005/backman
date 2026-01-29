import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Users, Target, FlaskConical, Megaphone, FileText, Plus, Edit2, Trash2,
  Play, Pause, Trophy, RefreshCw, Loader2, Check, X, Star, ChevronRight,
  BarChart3, Eye, Copy, Calendar, Zap
} from 'lucide-react';

const AdminPromotions = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [icps, setIcps] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, icpsRes, testsRes, campaignsRes] = await Promise.all([
        adminAPI.getPromotionsDashboard(),
        adminAPI.getICPs(),
        adminAPI.getABTests(),
        adminAPI.getCampaigns()
      ]);
      setDashboard(dashboardRes.data);
      setIcps(icpsRes.data);
      setAbTests(testsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error loading promotions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-promotions-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotion Planning</h1>
          <p className="text-gray-500">ICP targeting, A/B testing, and campaigns</p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="icps" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Target className="w-4 h-4" /> ICPs
          </TabsTrigger>
          <TabsTrigger value="ab-tests" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <FlaskConical className="w-4 h-4" /> A/B Tests
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Megaphone className="w-4 h-4" /> Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab dashboard={dashboard} />
        </TabsContent>

        <TabsContent value="icps">
          <ICPsTab icps={icps} onRefresh={loadData} showMessage={showMessage} />
        </TabsContent>

        <TabsContent value="ab-tests">
          <ABTestsTab tests={abTests} onRefresh={loadData} showMessage={showMessage} />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab campaigns={campaigns} icps={icps} onRefresh={loadData} showMessage={showMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ dashboard }) => {
  const stats = [
    { label: 'Active ICPs', value: dashboard?.icps?.active || 0, total: dashboard?.icps?.total || 0, icon: Target, color: 'from-blue-500 to-cyan-500' },
    { label: 'Running A/B Tests', value: dashboard?.ab_tests?.running || 0, total: dashboard?.ab_tests?.total || 0, icon: FlaskConical, color: 'from-purple-500 to-pink-500' },
    { label: 'Active Campaigns', value: dashboard?.campaigns?.active || 0, total: dashboard?.campaigns?.total || 0, icon: Megaphone, color: 'from-orange-500 to-red-500' },
    { label: 'Templates', value: dashboard?.templates?.total || 0, total: null, icon: FileText, color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
                {stat.total !== null && <span className="text-sm font-normal text-gray-400">/{stat.total}</span>}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard 
            icon={Target} 
            title="Create ICP" 
            description="Define your ideal customer profile"
            color="blue"
          />
          <QuickActionCard 
            icon={FlaskConical} 
            title="Start A/B Test" 
            description="Test different marketing messages"
            color="purple"
          />
          <QuickActionCard 
            icon={Megaphone} 
            title="Launch Campaign" 
            description="Create and launch a marketing campaign"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, color }) => {
  const colors = {
    blue: 'hover:border-blue-300 hover:bg-blue-50',
    purple: 'hover:border-purple-300 hover:bg-purple-50',
    orange: 'hover:border-orange-300 hover:bg-orange-50'
  };

  return (
    <div className={`p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${colors[color]}`}>
      <Icon className="w-8 h-8 text-gray-400 mb-2" />
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
};

// ICPs Tab
const ICPsTab = ({ icps, onRefresh, showMessage }) => {
  const [editingICP, setEditingICP] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDelete = async (icpId) => {
    if (!window.confirm('Delete this ICP?')) return;
    try {
      await adminAPI.deleteICP(icpId);
      showMessage('success', 'ICP deleted');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to delete ICP');
    }
  };

  const handleSetPrimary = async (icpId) => {
    try {
      await adminAPI.setPrimaryICP(icpId);
      showMessage('success', 'Primary ICP updated');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to update primary ICP');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Create ICP
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {icps.map((icp) => (
          <div key={icp.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${icp.is_primary ? 'ring-2 ring-pink-500' : ''}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{icp.name}</h3>
                    {icp.is_primary && (
                      <Badge className="bg-pink-100 text-pink-700">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{icp.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {icp.priority_score}
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-2 mb-4">
                {icp.demographics?.age_min && (
                  <p className="text-xs text-gray-500">
                    Age: {icp.demographics.age_min} - {icp.demographics.age_max || '∞'}
                  </p>
                )}
                {icp.demographics?.countries?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {icp.demographics.countries.slice(0, 4).map(c => (
                      <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Interests */}
              {icp.interests?.niches?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {icp.interests.niches.slice(0, 3).map(n => (
                    <Badge key={n} className="bg-purple-100 text-purple-700 text-xs capitalize">{n}</Badge>
                  ))}
                </div>
              )}

              {/* Pain Points */}
              {icp.pain_points?.goals?.length > 0 && (
                <div className="text-xs text-gray-500">
                  Goals: {icp.pain_points.goals.slice(0, 2).join(', ')}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditingICP(icp)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(icp.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {!icp.is_primary && (
                <Button size="sm" variant="outline" onClick={() => handleSetPrimary(icp.id)}>
                  <Star className="w-4 h-4 mr-1" /> Set Primary
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingICP) && (
        <ICPModal 
          icp={editingICP}
          onClose={() => { setShowCreate(false); setEditingICP(null); }}
          onSave={async (data) => {
            try {
              if (editingICP) {
                await adminAPI.updateICP(editingICP.id, data);
              } else {
                await adminAPI.createICP(data);
              }
              showMessage('success', editingICP ? 'ICP updated' : 'ICP created');
              onRefresh();
              setShowCreate(false);
              setEditingICP(null);
            } catch (error) {
              showMessage('error', 'Failed to save ICP');
            }
          }}
        />
      )}
    </div>
  );
};

// ICP Modal
const ICPModal = ({ icp, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: icp?.name || '',
    description: icp?.description || '',
    priority_score: icp?.priority_score || 50,
    demographics: icp?.demographics || { age_min: 18, age_max: 45, countries: [], genders: [] },
    behavior: icp?.behavior || { follower_count_min: 1000, follower_count_max: 50000 },
    interests: icp?.interests || { niches: [], hashtags: [] },
    pain_points: icp?.pain_points || { pain_points: [], goals: [], motivations: [] }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{icp ? 'Edit ICP' : 'Create ICP'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Growing Influencer"
                required
              />
            </div>
            <div>
              <Label>Priority Score (0-100)</Label>
              <Input 
                type="number"
                value={formData.priority_score}
                onChange={(e) => setFormData({...formData, priority_score: parseInt(e.target.value)})}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border rounded-lg"
              rows={2}
              placeholder="Describe this customer segment..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Age</Label>
              <Input 
                type="number"
                value={formData.demographics.age_min || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: {...formData.demographics, age_min: parseInt(e.target.value)}
                })}
              />
            </div>
            <div>
              <Label>Max Age</Label>
              <Input 
                type="number"
                value={formData.demographics.age_max || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: {...formData.demographics, age_max: parseInt(e.target.value)}
                })}
              />
            </div>
          </div>

          <div>
            <Label>Niches (comma separated)</Label>
            <Input 
              value={formData.interests.niches?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                interests: {...formData.interests, niches: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}
              })}
              placeholder="fashion, beauty, lifestyle"
            />
          </div>

          <div>
            <Label>Goals (comma separated)</Label>
            <Input 
              value={formData.pain_points.goals?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                pain_points: {...formData.pain_points, goals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}
              })}
              placeholder="Reach 10K followers, Get brand deals"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {icp ? 'Update ICP' : 'Create ICP'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// A/B Tests Tab
const ABTestsTab = ({ tests, onRefresh, showMessage }) => {
  const [showCreate, setShowCreate] = useState(false);

  const handleStart = async (testId) => {
    try {
      await adminAPI.startABTest(testId);
      showMessage('success', 'A/B test started');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to start test');
    }
  };

  const handleStop = async (testId) => {
    try {
      await adminAPI.stopABTest(testId);
      showMessage('success', 'A/B test stopped');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to stop test');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'winner_selected': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Create A/B Test
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-4 px-6 font-medium">Test Name</th>
              <th className="text-left py-4 px-6 font-medium">Type</th>
              <th className="text-left py-4 px-6 font-medium">Status</th>
              <th className="text-left py-4 px-6 font-medium">Variants</th>
              <th className="text-left py-4 px-6 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  No A/B tests yet. Create one to start testing!
                </td>
              </tr>
            ) : (
              tests.map((test) => (
                <tr key={test.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">{test.name}</p>
                    <p className="text-sm text-gray-500">{test.target_page}</p>
                  </td>
                  <td className="py-4 px-6 capitalize">{test.test_type}</td>
                  <td className="py-4 px-6">
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                  </td>
                  <td className="py-4 px-6">{test.variants?.length || 0}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {test.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => handleStart(test.id)}>
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => handleStop(test.id)}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <ABTestModal 
          onClose={() => setShowCreate(false)}
          onSave={async (data) => {
            try {
              await adminAPI.createABTest(data);
              showMessage('success', 'A/B test created');
              onRefresh();
              setShowCreate(false);
            } catch (error) {
              showMessage('error', 'Failed to create test');
            }
          }}
        />
      )}
    </div>
  );
};

// A/B Test Modal
const ABTestModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    test_type: 'headline',
    target_page: 'homepage',
    variants: [
      { name: 'Control', headline: '', is_control: true },
      { name: 'Variant A', headline: '' }
    ]
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Create A/B Test</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Test Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Homepage Headline Test"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Test Type</Label>
              <select 
                value={formData.test_type}
                onChange={(e) => setFormData({...formData, test_type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="headline">Headline</option>
                <option value="cta">CTA Button</option>
                <option value="image">Image</option>
                <option value="full_page">Full Page</option>
              </select>
            </div>
            <div>
              <Label>Target Page</Label>
              <select 
                value={formData.target_page}
                onChange={(e) => setFormData({...formData, target_page: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="homepage">Homepage</option>
                <option value="pricing">Pricing</option>
                <option value="landing">Landing Page</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Control Headline</Label>
            <Input 
              value={formData.variants[0]?.headline || ''}
              onChange={(e) => {
                const variants = [...formData.variants];
                variants[0].headline = e.target.value;
                setFormData({...formData, variants});
              }}
              placeholder="Current headline..."
            />
          </div>

          <div>
            <Label>Variant A Headline</Label>
            <Input 
              value={formData.variants[1]?.headline || ''}
              onChange={(e) => {
                const variants = [...formData.variants];
                variants[1].headline = e.target.value;
                setFormData({...formData, variants});
              }}
              placeholder="New headline to test..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Test
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Campaigns Tab
const CampaignsTab = ({ campaigns, icps, onRefresh, showMessage }) => {
  const [showCreate, setShowCreate] = useState(false);

  const handleLaunch = async (campaignId) => {
    try {
      await adminAPI.launchCampaign(campaignId);
      showMessage('success', 'Campaign launched');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to launch campaign');
    }
  };

  const handlePause = async (campaignId) => {
    try {
      await adminAPI.pauseCampaign(campaignId);
      showMessage('success', 'Campaign paused');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to pause campaign');
    }
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await adminAPI.deleteCampaign(campaignId);
      showMessage('success', 'Campaign deleted');
      onRefresh();
    } catch (error) {
      showMessage('error', 'Failed to delete campaign');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-xl p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No campaigns yet. Create your first campaign!</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">{campaign.description}</p>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{campaign.metrics?.impressions || 0}</p>
                    <p className="text-xs text-gray-500">Impressions</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{campaign.metrics?.clicks || 0}</p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{campaign.metrics?.conversions || 0}</p>
                    <p className="text-xs text-gray-500">Conversions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Type: {campaign.campaign_type}</span>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => handleLaunch(campaign.id)}>
                      <Play className="w-4 h-4 mr-1" /> Launch
                    </Button>
                  )}
                  {campaign.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handlePause(campaign.id)}>
                      <Pause className="w-4 h-4 mr-1" /> Pause
                    </Button>
                  )}
                  {campaign.status === 'paused' && (
                    <Button size="sm" variant="outline" onClick={() => handleLaunch(campaign.id)}>
                      <Play className="w-4 h-4 mr-1" /> Resume
                    </Button>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(campaign.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <CampaignModal 
          icps={icps}
          onClose={() => setShowCreate(false)}
          onSave={async (data) => {
            try {
              await adminAPI.createCampaign(data);
              showMessage('success', 'Campaign created');
              onRefresh();
              setShowCreate(false);
            } catch (error) {
              showMessage('error', 'Failed to create campaign');
            }
          }}
        />
      )}
    </div>
  );
};

// Campaign Modal
const CampaignModal = ({ icps, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'promo_banner',
    content: {
      headline: '',
      body: '',
      cta_text: '',
      cta_link: ''
    },
    target_all_users: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Create Campaign</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Campaign Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Spring Sale Campaign"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border rounded-lg"
              rows={2}
              placeholder="Campaign description..."
            />
          </div>

          <div>
            <Label>Campaign Type</Label>
            <select 
              value={formData.campaign_type}
              onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="promo_banner">Promo Banner</option>
              <option value="email">Email</option>
              <option value="social">Social Media</option>
              <option value="landing_page">Landing Page</option>
            </select>
          </div>

          <div>
            <Label>Headline</Label>
            <Input 
              value={formData.content.headline}
              onChange={(e) => setFormData({...formData, content: {...formData.content, headline: e.target.value}})}
              placeholder="Campaign headline..."
            />
          </div>

          <div>
            <Label>CTA Text</Label>
            <Input 
              value={formData.content.cta_text}
              onChange={(e) => setFormData({...formData, content: {...formData.content, cta_text: e.target.value}})}
              placeholder="e.g., Get Started Now"
            />
          </div>

          <div>
            <Label>CTA Link</Label>
            <Input 
              value={formData.content.cta_link}
              onChange={(e) => setFormData({...formData, content: {...formData.content, cta_link: e.target.value}})}
              placeholder="/pricing or https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPromotions;
