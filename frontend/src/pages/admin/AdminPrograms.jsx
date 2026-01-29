import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  Users, DollarSign, Gift, Check, X, Eye, 
  Loader2, RefreshCw, Settings, TrendingUp, CreditCard
} from 'lucide-react';
import api from '../../services/api';

export default function AdminPrograms() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('affiliates');
  
  // Affiliates
  const [affiliates, setAffiliates] = useState([]);
  const [affiliateStats, setAffiliateStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Referrals
  const [referrals, setReferrals] = useState([]);
  const [referralStats, setReferralStats] = useState({});
  
  // Settings
  const [settings, setSettings] = useState({ affiliate: {}, referral: {} });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [affRes, refRes, setRes] = await Promise.all([
        api.get('/admin/programs/affiliates'),
        api.get('/admin/programs/referrals'),
        api.get('/admin/programs/settings')
      ]);
      
      setAffiliates(affRes.data.affiliates || []);
      setAffiliateStats(affRes.data.stats || {});
      setReferrals(refRes.data.referrals || []);
      setReferralStats(refRes.data.stats || {});
      setSettings(setRes.data || { affiliate: {}, referral: {} });
    } catch (error) {
      console.error('Failed to load programs data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliate = async (id, data) => {
    try {
      await api.put(`/admin/programs/affiliates/${id}`, data);
      toast.success('Affiliate updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update affiliate');
    }
  };

  const completeReferral = async (id) => {
    try {
      await api.put(`/admin/programs/referrals/${id}/complete`);
      toast.success('Referral completed, reward credited');
      loadData();
    } catch (error) {
      toast.error('Failed to complete referral');
    }
  };

  const saveSettings = async (type) => {
    setSavingSettings(true);
    try {
      await api.put(`/admin/programs/settings/${type}`, settings[type]);
      toast.success(`${type} settings saved`);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredAffiliates = statusFilter === 'all' 
    ? affiliates 
    : affiliates.filter(a => a.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-7 h-7 text-green-500" />
            Partner Programs
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage affiliates, referrals, and reward settings
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Affiliates</p>
                <p className="text-2xl font-bold">{affiliateStats.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-500">{affiliateStats.pending || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold">{referralStats.total || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rewards Paid</p>
                <p className="text-2xl font-bold">${referralStats.total_rewards_paid || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-pink-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="referrals">User Referrals</TabsTrigger>
          <TabsTrigger value="settings">Program Settings</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Affiliate Applications</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAffiliates.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No affiliates found</p>
                ) : (
                  filteredAffiliates.map(affiliate => (
                    <div key={affiliate.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{affiliate.name}</p>
                            <Badge variant={
                              affiliate.status === 'approved' ? 'default' :
                              affiliate.status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {affiliate.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{affiliate.email}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Code: <span className="font-mono">{affiliate.affiliate_code}</span> | 
                            Commission: {affiliate.commission_rate}%
                          </p>
                          {affiliate.website && (
                            <p className="text-sm text-blue-500 mt-1">{affiliate.website}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {affiliate.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateAffiliate(affiliate.id, { status: 'approved' })}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateAffiliate(affiliate.id, { status: 'rejected' })}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {affiliate.status === 'approved' && (
                            <div className="text-right text-sm">
                              <p>Earnings: <span className="font-semibold">${affiliate.total_earnings || 0}</span></p>
                              <p className="text-gray-500">Pending: ${affiliate.pending_earnings || 0}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No referrals yet</p>
                ) : (
                  referrals.map(ref => (
                    <div key={ref.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{ref.referrer_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{ref.referrer_email}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                            {ref.status}
                          </Badge>
                          <p className="text-sm mt-1">${ref.reward || 10} reward</p>
                        </div>
                        {ref.status === 'pending' && (
                          <Button size="sm" onClick={() => completeReferral(ref.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Affiliate Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Affiliate Program Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Program Enabled</p>
                    <p className="text-sm text-gray-500">Allow new affiliate applications</p>
                  </div>
                  <Switch
                    checked={settings.affiliate?.enabled !== false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      affiliate: { ...settings.affiliate, enabled: v }
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Commission Rate (%)</label>
                  <Input
                    type="number"
                    value={settings.affiliate?.commission_rate || 20}
                    onChange={(e) => setSettings({
                      ...settings,
                      affiliate: { ...settings.affiliate, commission_rate: parseFloat(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Cookie Duration (days)</label>
                  <Input
                    type="number"
                    value={settings.affiliate?.cookie_days || 30}
                    onChange={(e) => setSettings({
                      ...settings,
                      affiliate: { ...settings.affiliate, cookie_days: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Minimum Payout ($)</label>
                  <Input
                    type="number"
                    value={settings.affiliate?.min_payout || 50}
                    onChange={(e) => setSettings({
                      ...settings,
                      affiliate: { ...settings.affiliate, min_payout: parseFloat(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={() => saveSettings('affiliate')} 
                  disabled={savingSettings}
                  className="w-full"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Affiliate Settings
                </Button>
              </CardContent>
            </Card>

            {/* Referral Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Referral Program Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Program Enabled</p>
                    <p className="text-sm text-gray-500">Allow user referrals</p>
                  </div>
                  <Switch
                    checked={settings.referral?.enabled !== false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      referral: { ...settings.referral, enabled: v }
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Referrer Reward ($)</label>
                  <Input
                    type="number"
                    value={settings.referral?.referrer_reward || 10}
                    onChange={(e) => setSettings({
                      ...settings,
                      referral: { ...settings.referral, referrer_reward: parseFloat(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Referee Discount (%)</label>
                  <Input
                    type="number"
                    value={settings.referral?.referee_discount || 20}
                    onChange={(e) => setSettings({
                      ...settings,
                      referral: { ...settings.referral, referee_discount: parseFloat(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Subscription</p>
                    <p className="text-sm text-gray-500">Only credit after referee subscribes</p>
                  </div>
                  <Switch
                    checked={settings.referral?.require_subscription !== false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      referral: { ...settings.referral, require_subscription: v }
                    })}
                  />
                </div>
                
                <Button 
                  onClick={() => saveSettings('referral')} 
                  disabled={savingSettings}
                  className="w-full"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Referral Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
