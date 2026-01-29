import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import {
  Users, TrendingUp, Eye, Heart, Settings, LogOut, Bell,
  ChevronRight, ArrowUpRight, Instagram, Target,
  Pause, Play, BarChart3, Zap, Crown, MessageCircle, Loader2,
  CreditCard, Calendar, CheckCircle, XCircle, Clock, RefreshCw,
  AlertTriangle, Receipt, ArrowUp, Save, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { instagramAPI, notificationsAPI, paymentAPI, ticketsAPI, authAPI } from '../services/api';
import TwoFactorSettings from '../components/TwoFactorSettings';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [isGrowthActive, setIsGrowthActive] = useState(true);
  const [instagramAccount, setInstagramAccount] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  
  // Targeting state
  const [targeting, setTargeting] = useState({
    niche: '',
    locations: '',
    competitors: '',
    hashtags: ''
  });
  const [savingTargeting, setSavingTargeting] = useState(false);
  const [targetingMessage, setTargetingMessage] = useState('');
  
  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  
  // Settings state
  const [userSettings, setUserSettings] = useState({ name: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Default stats when no real data
  const defaultStats = {
  const defaultStats = {
    followers: 0,
    followersGrowth: 0,
    engagement: 0,
    engagementGrowth: 0,
    reach: 0,
    reachGrowth: 0,
    profileVisits: 0,
    profileVisitsGrowth: 0,
    followers_this_month: 0
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load Instagram account
      try {
        const igResponse = await instagramAPI.getAccount();
        if (igResponse.data) {
          setInstagramAccount(igResponse.data);
          setIsGrowthActive(!igResponse.data.growth_paused);
          
          // Load stats if account exists
          try {
            const statsResponse = await instagramAPI.getStats();
            setStats(statsResponse.data);
          } catch (e) {
            setStats(null);
          }
        }
      } catch (e) {
        setStats(null);
      }
      
      // Load subscription from payment API
      try {
        const subResponse = await paymentAPI.getCurrentSubscription();
        if (subResponse.data.has_subscription) {
          setSubscription(subResponse.data.subscription);
        }
      } catch (e) {
        // No subscription
      }
      
      // Load payment history
      try {
        const historyResponse = await paymentAPI.getPaymentHistory();
        setPaymentHistory(historyResponse.data || []);
      } catch (e) {
        // No history
      }
      
      // Load notification count
      try {
        const notifResponse = await notificationsAPI.getUnreadCount();
        setUnreadCount(notifResponse.data.unread_count);
      } catch (e) {
        // Ignore
      }
      
      // Load targeting settings
      try {
        const targetingResponse = await instagramAPI.getTargeting();
        if (targetingResponse.data) {
          setTargeting({
            niche: targetingResponse.data.niche || '',
            locations: Array.isArray(targetingResponse.data.locations) ? targetingResponse.data.locations.join(', ') : '',
            competitors: Array.isArray(targetingResponse.data.competitor_accounts) ? targetingResponse.data.competitor_accounts.join(', ') : '',
            hashtags: Array.isArray(targetingResponse.data.hashtags) ? targetingResponse.data.hashtags.join(', ') : ''
          });
        }
      } catch (e) {
        // No targeting
      }
      
      // Set user settings
      if (user) {
        setUserSettings({ name: user.name || '' });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSaveTargeting = async () => {
    setSavingTargeting(true);
    setTargetingMessage('');
    try {
      await instagramAPI.updateTargeting({
        niche: targeting.niche,
        locations: targeting.locations.split(',').map(s => s.trim()).filter(Boolean),
        competitor_accounts: targeting.competitors.split(',').map(s => s.trim()).filter(Boolean),
        hashtags: targeting.hashtags.split(',').map(s => s.trim().replace('#', '')).filter(Boolean)
      });
      setTargetingMessage('Targeting saved successfully!');
      setTimeout(() => setTargetingMessage(''), 3000);
    } catch (error) {
      setTargetingMessage('Failed to save targeting. Connect Instagram first.');
    } finally {
      setSavingTargeting(false);
    }
  };
  
  const handleSubmitTicket = async () => {
    if (!ticketSubject || !ticketMessage) return;
    
    setSubmittingTicket(true);
    try {
      await ticketsAPI.create({
        subject: ticketSubject,
        message: ticketMessage,
        priority: 'medium'
      });
      setTicketSubject('');
      setTicketMessage('');
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setSubmittingTicket(false);
    }
  };
  
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await authAPI.updateMe({ name: userSettings.name });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleGrowth = async () => {
    if (instagramAccount) {
      try {
        await instagramAPI.updateAccount({ growth_paused: isGrowthActive });
        setIsGrowthActive(!isGrowthActive);
      } catch (error) {
        console.error('Error toggling growth:', error);
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }
    
    setCancellingSubscription(true);
    try {
      await paymentAPI.cancelSubscription();
      // Reload subscription data
      const subResponse = await paymentAPI.getCurrentSubscription();
      if (subResponse.data.has_subscription) {
        setSubscription(subResponse.data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  // Use actual stats or defaults
  const displayStats = stats || defaultStats;

  const statsCards = [
    {
      label: 'Total Followers',
      value: (displayStats.followers_count || displayStats.followers || 0).toLocaleString(),
      change: displayStats.followersGrowth ? `+${displayStats.followersGrowth} today` : 'Connect IG',
      trend: 'up',
      icon: Users,
      color: 'from-pink-500 to-rose-500'
    },
    {
      label: 'Engagement Rate',
      value: `${displayStats.engagement_rate || displayStats.engagement || 0}%`,
      change: displayStats.engagementGrowth ? `+${displayStats.engagementGrowth}%` : '--',
      trend: 'up',
      icon: Heart,
      color: 'from-orange-500 to-pink-500'
    },
    {
      label: 'Profile Reach',
      value: displayStats.reach ? `${(displayStats.reach / 1000).toFixed(1)}K` : '0',
      change: displayStats.reachGrowth ? `+${displayStats.reachGrowth}%` : '--',
      trend: 'up',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Profile Visits',
      value: (displayStats.profileVisits || 0).toLocaleString(),
      change: displayStats.profileVisitsGrowth ? `+${displayStats.profileVisitsGrowth}%` : '--',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const targetSettings = instagramAccount?.targeting || [
    { label: 'Niche', value: 'Not configured' },
    { label: 'Location', value: 'Not configured' },
    { label: 'Interests', value: 'Not configured' },
    { label: 'Competitors', value: 'Not configured' }
  ];

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get plan limits based on plan name
  const getPlanLimits = (planName) => {
    const limits = {
      basic: { min: 1000, max: 1500 },
      pro: { min: 2500, max: 3500 },
      enterprise: { min: 5000, max: 10000 }
    };
    return limits[planName?.toLowerCase()] || { min: 0, max: 3500 };
  };

  const planLimits = getPlanLimits(subscription?.plan);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Adverlyx</span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'overview' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'billing' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-5 h-5" />
            Billing
          </button>
          <button 
            onClick={() => setActiveTab('targeting')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'targeting' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Target className="w-5 h-5" />
            Targeting
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'analytics' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'support' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageCircle className="w-5 h-5" />
            Support
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'settings' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          {subscription ? (
            <div className={`rounded-xl p-4 mb-4 ${subscription.status === 'active' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-yellow-50 to-orange-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {subscription.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-semibold text-gray-900 capitalize">{subscription.plan} Plan</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Status: <span className={`font-medium capitalize ${subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{subscription.status}</span>
              </p>
              <p className="text-xs text-gray-500 capitalize">Billing: {subscription.billing_cycle}</p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-gray-900">No Plan</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Subscribe to start growing</p>
              <Link to="/pricing">
                <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm" data-testid="view-plans-btn">
                  View Plans
                </Button>
              </Link>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                </Link>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h1>
                <p className="text-sm text-gray-500">
                  {activeTab === 'billing' ? 'Manage your subscription & billing' : "Here's your growth overview"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                )}
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : activeTab === 'billing' ? (
            /* Billing Tab */
            <div className="space-y-6">
              {/* Current Plan Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h2>
                
                {subscription ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Crown className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 capitalize">{subscription.plan} Plan</h3>
                          <p className="text-gray-600 capitalize">{subscription.billing_cycle} billing</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">${subscription.amount?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-500">per {subscription.billing_cycle === 'yearly' ? 'year' : 'month'}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Status</span>
                        </div>
                        <p className={`font-semibold capitalize ${subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {subscription.status}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Started</span>
                        </div>
                        <p className="font-semibold text-gray-900">{formatDate(subscription.started_at)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <RefreshCw className="w-4 h-4" />
                          <span className="text-sm">Next Billing</span>
                        </div>
                        <p className="font-semibold text-gray-900">{formatDate(subscription.next_billing_date)}</p>
                      </div>
                    </div>

                    {/* Plan Features */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Plan Includes:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{planLimits.min.toLocaleString()} - {planLimits.max.toLocaleString()} followers/month</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>AI-Powered Targeting</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Real-Time Analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>24/7 Support</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 border-t pt-4">
                      <Link to="/pricing">
                        <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
                          <ArrowUp className="w-4 h-4" />
                          Upgrade Plan
                        </Button>
                      </Link>
                      {subscription.status === 'active' && (
                        <Button 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={handleCancelSubscription}
                          disabled={cancellingSubscription}
                        >
                          {cancellingSubscription ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h3>
                    <p className="text-gray-600 mb-6">Subscribe to a plan to start growing your Instagram</p>
                    <Link to="/pricing">
                      <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
                        View Plans
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                  <Receipt className="w-5 h-5 text-gray-400" />
                </div>
                
                {paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plan</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{formatDate(payment.created_at)}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 capitalize">{payment.plan}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">${payment.amount?.toFixed(2)} {payment.currency?.toUpperCase()}</td>
                            <td className="py-3 px-4">
                              <Badge className={
                                payment.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                payment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {payment.payment_status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No payment history yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'targeting' ? (
            /* Targeting Tab */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Targeting Settings</h2>
                {instagramAccount ? (
                  <div className="space-y-6">
                    {targetingMessage && (
                      <div className={`p-3 rounded-lg ${targetingMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {targetingMessage}
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                        <Input 
                          type="text" 
                          className="w-full"
                          placeholder="e.g., Fashion & Lifestyle"
                          value={targeting.niche}
                          onChange={(e) => setTargeting(prev => ({ ...prev, niche: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Locations (comma separated)</label>
                        <Input 
                          type="text" 
                          className="w-full"
                          placeholder="e.g., United States, United Kingdom"
                          value={targeting.locations}
                          onChange={(e) => setTargeting(prev => ({ ...prev, locations: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Accounts (comma separated)</label>
                      <Input 
                        type="text" 
                        className="w-full"
                        placeholder="@competitor1, @competitor2"
                        value={targeting.competitors}
                        onChange={(e) => setTargeting(prev => ({ ...prev, competitors: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Hashtags (comma separated)</label>
                      <Input 
                        type="text" 
                        className="w-full"
                        placeholder="#fashion, #lifestyle, #ootd"
                        value={targeting.hashtags}
                        onChange={(e) => setTargeting(prev => ({ ...prev, hashtags: e.target.value }))}
                      />
                    </div>
                    <Button 
                      onClick={handleSaveTargeting}
                      disabled={savingTargeting}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    >
                      {savingTargeting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Targeting
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Connect your Instagram to configure targeting</p>
                    <Link to="/connect-instagram" className="text-pink-600 hover:underline text-sm">
                      Connect Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            /* Analytics Tab */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth Analytics</h2>
                {stats ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
                        <p className="text-sm text-gray-500">Total Followers Gained</p>
                        <p className="text-2xl font-bold text-gray-900">{(stats.total_followers_gained || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                        <p className="text-sm text-gray-500">This Month</p>
                        <p className="text-2xl font-bold text-gray-900">{(stats.followers_this_month || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <p className="text-sm text-gray-500">Engagement Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.engagement_rate || 0}%</p>
                      </div>
                    </div>
                    <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                      <p className="text-gray-400">Detailed charts coming soon</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Connect your Instagram to see analytics</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'support' ? (
            /* Support Tab */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Support Ticket</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea 
                      className="w-full px-4 py-2 border rounded-lg h-32 resize-none"
                      placeholder="Describe your issue..."
                    />
                  </div>
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                    Submit Ticket
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">FAQ</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">How long does it take to see results?</p>
                    <p className="text-sm text-gray-500 mt-1">You&apos;ll start seeing new followers within 24-48 hours of activating your account.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Is my account safe?</p>
                    <p className="text-sm text-gray-500 mt-1">Yes! We use 100% organic methods that comply with Instagram&apos;s terms of service.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Can I cancel anytime?</p>
                    <p className="text-sm text-gray-500 mt-1">Absolutely. You can cancel your subscription at any time from the Billing tab.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'settings' ? (
            /* Settings Tab */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 border rounded-lg"
                        defaultValue={user?.name || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <Button className="bg-gray-900 text-white">Save Changes</Button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Email notifications</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Growth milestone alerts</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Weekly reports</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </label>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Danger Zone</h2>
                <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back.</p>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </div>
          ) : (
            /* Overview Tab */
            <>
              {/* Growth Status Card */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <Instagram className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">@{instagramAccount?.username || 'Connect Account'}</h2>
                      <p className="text-gray-400 text-sm">{instagramAccount ? 'Connected Account' : 'No account connected'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isGrowthActive && instagramAccount ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                      <span className="text-white text-sm">
                        {!instagramAccount ? 'Connect to Start' : isGrowthActive ? 'AI Growth Engine Active' : 'Growth Paused'}
                      </span>
                    </div>
                    <Button
                      onClick={toggleGrowth}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 rounded-full"
                      disabled={!instagramAccount}
                    >
                      {isGrowthActive ? (
                        <><Pause className="w-4 h-4 mr-2" /> Pause</>  
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> Resume</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* No Instagram Connected Banner */}
              {!instagramAccount && (
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Connect your Instagram account to start growing</p>
                      <p className="text-xs text-gray-600">Link your account to enable AI-powered growth and real-time analytics</p>
                    </div>
                    <Link to="/connect-instagram">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                        Connect Instagram
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {stat.change !== '--' && stat.change !== 'Connect IG' ? (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <ArrowUpRight className="w-4 h-4" />
                            {stat.change}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{stat.change}</span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Growth Analytics</h3>
                      <p className="text-sm text-gray-500">Followers gained this week</p>
                    </div>
                    {instagramAccount ? (
                      <Badge className="bg-green-100 text-green-700">+{displayStats.followersGrowth || 0} this week</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500">No data</Badge>
                    )}
                  </div>
                  {instagramAccount ? (
                    <div className="h-64 flex items-end gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-pink-500 to-orange-400 rounded-t-md transition-all hover:opacity-80"
                            style={{ height: `${Math.random() * 80 + 20}%` }}
                          ></div>
                          <span className="text-xs text-gray-500">{day}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Connect Instagram to see growth data</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Settings */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Target Settings</h3>
                    <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {Array.isArray(targetSettings) ? targetSettings.map((setting) => (
                      <div key={setting.label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-500">{setting.label}</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[150px]">{setting.value}</span>
                      </div>
                    )) : (
                      <>
                        <div className="flex items-start justify-between py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Niche</span>
                          <span className="text-sm font-medium text-gray-900">Not configured</span>
                        </div>
                        <div className="flex items-start justify-between py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Location</span>
                          <span className="text-sm font-medium text-gray-900">Not configured</span>
                        </div>
                        <div className="flex items-start justify-between py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Interests</span>
                          <span className="text-sm font-medium text-gray-900">Not configured</span>
                        </div>
                        <div className="flex items-start justify-between py-3">
                          <span className="text-sm text-gray-500">Competitors</span>
                          <span className="text-sm font-medium text-gray-900">Not configured</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-900">AI Optimization</span>
                    </div>
                    <p className="text-sm text-gray-600">Our AI is continuously optimizing your targeting for best results.</p>
                  </div>
                </div>
              </div>

              {/* Monthly Progress */}
              <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Growth Progress</h3>
                    <p className="text-sm text-gray-500">Your guaranteed followers this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {(displayStats.followers_this_month || 0).toLocaleString()} / {planLimits.max.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">followers gained</p>
                  </div>
                </div>
                <Progress value={Math.min(((displayStats.followers_this_month || 0) / planLimits.max) * 100, 100)} className="h-3" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">{Math.round(((displayStats.followers_this_month || 0) / planLimits.max) * 100)}% complete</span>
                  {subscription ? (
                    <span className="text-sm text-green-600 font-medium">On track to exceed goal!</span>
                  ) : (
                    <Link to="/pricing" className="text-sm text-pink-600 font-medium hover:underline">Subscribe to start growing</Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
