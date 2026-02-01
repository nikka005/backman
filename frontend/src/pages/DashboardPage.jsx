import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import {
  Users, TrendingUp, Eye, Heart, Settings, LogOut, Bell,
  ChevronRight, ArrowUpRight, Instagram, Target,
  Pause, Play, BarChart3, Zap, Crown, MessageCircle, Loader2,
  CreditCard, Calendar, CheckCircle, XCircle, Clock, RefreshCw,
  AlertTriangle, Receipt, ArrowUp, Save, Shield, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { instagramAPI, notificationsAPI, paymentAPI, ticketsAPI, authAPI, aiAnalyticsAPI, notificationPreferencesAPI } from '../services/api';
import TwoFactorSettings from '../components/TwoFactorSettings';
import { toast } from 'sonner';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  // Handle tab from URL params (for mobile nav)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['overview', 'billing', 'targeting', 'analytics', 'support', 'settings'].includes(tab)) {
      setActiveTab(tab);
    } else if (!location.search && location.pathname === '/dashboard') {
      setActiveTab('overview');
    }
  }, [location.search, location.pathname]);
  
  // Helper function to change tabs and update URL consistently
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/dashboard?tab=${newTab}`, { replace: true });
  };
  
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
  const [refreshingData, setRefreshingData] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  
  // AI Analytics state
  const [aiDashboard, setAiDashboard] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [contentRecommendations, setContentRecommendations] = useState([]);
  const [performanceScores, setPerformanceScores] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    growth_milestone_alerts: true,
    weekly_reports: true,
    promotional_emails: false,
    security_alerts: true,
    billing_alerts: true,
    new_features: true,
    tips_and_tricks: true
  });
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  
  // Instagram insights state
  const [instagramInsights, setInstagramInsights] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);

  // Default stats when no real data
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

  const loadDashboardData = useCallback(async () => {
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
      
      // If OAuth connected, fetch real analytics
      try {
        const analyticsResponse = await instagramAPI.getAnalyticsSummary();
        if (analyticsResponse.data) {
          const analytics = analyticsResponse.data;
          setStats(prev => ({
            ...prev,
            followers_count: analytics.current_followers,
            following_count: prev?.following_count || 0,
            engagement_rate: analytics.engagement_rate,
            total_followers_gained: analytics.total_followers_gained,
            followersGrowth: analytics.followers_today,
            followers_this_month: analytics.followers_this_month,
            growth_percentage: analytics.growth_percentage
          }));
        }
      } catch (e) {
        // Use existing stats
      }
      
      // Set user settings and AI analysis
      if (user) {
        setUserSettings({ name: user?.name || '' });
        // Load AI analysis from user profile
        if (user.ai_analysis) {
          setAiAnalysis(user.ai_analysis);
        }
      }
      
      // Load AI Analytics dashboard data
      try {
        const aiResponse = await aiAnalyticsAPI.getDashboard();
        if (aiResponse.data) {
          setAiDashboard(aiResponse.data);
          setAiInsights(aiResponse.data.growth_analysis?.insights || []);
          setContentRecommendations(aiResponse.data.content_recommendations || []);
          setPerformanceScores(aiResponse.data.performance_scores || null);
        }
      } catch (e) {
        // AI analytics not available
      }
      
      // Load Instagram insights (detailed metrics)
      try {
        const insightsResponse = await instagramAPI.getInsights();
        if (insightsResponse.data) {
          setInstagramInsights(insightsResponse.data);
          setRecentPosts(insightsResponse.data.recent_posts || []);
        }
      } catch (e) {
        // Insights not available
      }
      
      // Load notification preferences
      try {
        const prefsResponse = await notificationPreferencesAPI.getPreferences();
        if (prefsResponse.data) {
          setNotificationPrefs(prefsResponse.data);
        }
      } catch (e) {
        // Use defaults
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSaveTargeting = async () => {
    if (!instagramAccount) {
      toast.error('Please connect your Instagram account first');
      return;
    }
    
    setSavingTargeting(true);
    setTargetingMessage('');
    try {
      await instagramAPI.updateTargeting({
        niche: targeting.niche,
        locations: targeting.locations.split(',').map(s => s.trim()).filter(Boolean),
        competitor_accounts: targeting.competitors.split(',').map(s => s.trim().replace('@', '')).filter(Boolean),
        hashtags: targeting.hashtags.split(',').map(s => s.trim().replace('#', '')).filter(Boolean)
      });
      setTargetingMessage('Targeting saved successfully!');
      toast.success('Targeting settings saved!');
      
      // Reload targeting to confirm save
      const targetingResponse = await instagramAPI.getTargeting();
      if (targetingResponse.data) {
        setTargeting({
          niche: targetingResponse.data.niche || '',
          locations: Array.isArray(targetingResponse.data.locations) ? targetingResponse.data.locations.join(', ') : '',
          competitors: Array.isArray(targetingResponse.data.competitor_accounts) ? targetingResponse.data.competitor_accounts.join(', ') : '',
          hashtags: Array.isArray(targetingResponse.data.hashtags) ? targetingResponse.data.hashtags.join(', ') : ''
        });
      }
      
      setTimeout(() => setTargetingMessage(''), 3000);
    } catch (error) {
      console.error('Error saving targeting:', error);
      setTargetingMessage('Failed to save targeting.');
      toast.error('Failed to save targeting. Please try again.');
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
      toast.success('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };
  
  const handleSaveNotificationPrefs = async () => {
    setSavingNotifPrefs(true);
    try {
      await notificationPreferencesAPI.updatePreferences(notificationPrefs);
      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSavingNotifPrefs(false);
    }
  };
  
  const handleNotifPrefChange = (key, value) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
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

  // Refresh Instagram data from API
  const handleRefreshData = async () => {
    if (!instagramAccount) return;
    
    setRefreshingData(true);
    try {
      const response = await instagramAPI.refreshData();
      if (response.data.success) {
        // Update stats with fresh data
        setStats(prev => ({
          ...prev,
          followers_count: response.data.followers_count,
          following_count: response.data.following_count,
          posts_count: response.data.posts_count,
          engagement_rate: response.data.engagement_rate
        }));
        
        // Update instagram account data
        setInstagramAccount(prev => ({
          ...prev,
          followers_count: response.data.followers_count,
          following_count: response.data.following_count,
          posts_count: response.data.posts_count,
          engagement_rate: response.data.engagement_rate
        }));
        
        setLastRefreshed(new Date().toISOString());
        
        if (response.data.data_source === 'instagram_api') {
          toast.success('Data refreshed from Instagram!');
        } else if (response.data.token_expired) {
          toast.warning('Token expired. Please reconnect Instagram for live data.');
        } else if (response.data.data_source === 'manual') {
          // For manual connections, try the sync endpoint instead
          try {
            const syncResponse = await instagramAPI.syncData();
            if (syncResponse.data.synced) {
              setStats(prev => ({
                ...prev,
                followers_count: syncResponse.data.total_followers,
                followersGrowth: syncResponse.data.new_followers
              }));
              setInstagramAccount(prev => ({
                ...prev,
                followers_count: syncResponse.data.total_followers
              }));
              toast.success(syncResponse.data.message);
            } else {
              toast.info(syncResponse.data.message || 'Data is up to date');
            }
          } catch (syncError) {
            toast.info('Sync in progress...');
          }
        } else {
          toast.info(response.data.message || 'Using cached data');
        }
      }
    } catch (error) {
      // Fallback to sync endpoint for manual connections
      try {
        const syncResponse = await instagramAPI.syncData();
        if (syncResponse.data.synced) {
          setStats(prev => ({
            ...prev,
            followers_count: syncResponse.data.total_followers,
            followersGrowth: syncResponse.data.new_followers
          }));
          setInstagramAccount(prev => ({
            ...prev,
            followers_count: syncResponse.data.total_followers
          }));
          toast.success(syncResponse.data.message);
        } else {
          toast.info(syncResponse.data.message || 'Data is up to date');
        }
      } catch (syncError) {
        console.error('Error syncing data:', syncError);
        toast.error('Failed to refresh data');
      }
    } finally {
      setRefreshingData(false);
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
  const displayStats = stats ? {
    ...stats,
    // Map API fields to display fields
    followers: stats.followers_count || stats.followers || 0,
    followersGrowth: stats.followers_gained_today || stats.followersGrowth || 0,
    reach: stats.reach_today || stats.reach || 0,
    reachGrowth: stats.reach_this_week ? Math.round((stats.reach_today / (stats.reach_this_week / 7)) * 100 - 100) : 0,
    profileVisits: stats.profile_visits_today || stats.profileVisits || 0,
    profileVisitsGrowth: stats.profile_visits_this_week ? Math.round((stats.profile_visits_today / (stats.profile_visits_this_week / 7)) * 100 - 100) : 0,
    followers_this_week: stats.followers_this_week || stats.followers_gained_this_week || 0,
    followers_this_month: stats.followers_this_month || stats.followers_gained_this_month || 0,
    impressions: stats.impressions_today || 0,
    website_clicks: stats.website_clicks_today || 0
  } : defaultStats;

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

  // Build target settings from the loaded targeting state
  const targetSettings = [
    { label: 'Niche', value: targeting.niche || 'Not configured' },
    { label: 'Location', value: targeting.locations || 'Not configured' },
    { label: 'Hashtags', value: targeting.hashtags || 'Not configured' },
    { label: 'Competitors', value: targeting.competitors || 'Not configured' }
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
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'overview' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <Link 
            to="/growth"
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors text-gray-600 hover:bg-gray-50"
          >
            <Zap className="w-5 h-5" />
            Growth Engine
          </Link>
          <button 
            onClick={() => handleTabChange('billing')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'billing' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-5 h-5" />
            Billing
          </button>
          <button 
            onClick={() => handleTabChange('targeting')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'targeting' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Target className="w-5 h-5" />
            Targeting
          </button>
          <button 
            onClick={() => handleTabChange('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'analytics' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => handleTabChange('support')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${activeTab === 'support' ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageCircle className="w-5 h-5" />
            Support
          </button>
          <button 
            onClick={() => handleTabChange('settings')}
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
      <main className="lg:ml-64 pb-4 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="lg:hidden">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                </Link>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                  <span className="hidden sm:inline">Welcome back, </span>
                  {user?.name || 'User'}!
                </h1>
                <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">
                  {activeTab === 'billing' ? 'Manage your subscription & billing' : "Here's your growth overview"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                )}
              </button>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Mobile Tab Navigation */}
          <div className="lg:hidden overflow-x-auto border-t border-gray-100">
            <div className="flex px-2 py-2 gap-1 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'billing', label: 'Billing', icon: CreditCard },
                { id: 'targeting', label: 'Targeting', icon: Target },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'support', label: 'Support', icon: MessageCircle },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    data-testid={`tab-${tab.id}`}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-100 text-pink-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
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
            /* Analytics Tab - Enhanced with AI Insights */
            <div className="space-y-6">
              {/* Performance Scores */}
              {performanceScores && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Performance Score
                  </h2>
                  <div className="grid md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <div className="text-3xl font-bold text-purple-600">{performanceScores.overall_score}</div>
                      <p className="text-sm text-gray-500">Overall</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-pink-600">{performanceScores.engagement_score}</div>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{performanceScores.growth_score}</div>
                      <p className="text-xs text-gray-500">Growth</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{performanceScores.content_score}</div>
                      <p className="text-xs text-gray-500">Content</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">{performanceScores.consistency_score}</div>
                      <p className="text-xs text-gray-500">Consistency</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Growth Analytics */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth Analytics</h2>
                {stats ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-4">
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
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <p className="text-sm text-gray-500">Reach</p>
                        <p className="text-2xl font-bold text-gray-900">{instagramInsights?.reach ? `${(instagramInsights.reach / 1000).toFixed(1)}K` : '—'}</p>
                      </div>
                    </div>
                    
                    {/* Additional Instagram Metrics */}
                    {instagramInsights && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-gray-100 rounded-xl">
                          <p className="text-sm text-gray-500">Impressions</p>
                          <p className="text-xl font-bold text-gray-900">{instagramInsights.impressions?.toLocaleString() || '—'}</p>
                        </div>
                        <div className="p-4 border border-gray-100 rounded-xl">
                          <p className="text-sm text-gray-500">Profile Views</p>
                          <p className="text-xl font-bold text-gray-900">{instagramInsights.profile_views?.toLocaleString() || '—'}</p>
                        </div>
                        <div className="p-4 border border-gray-100 rounded-xl">
                          <p className="text-sm text-gray-500">Website Clicks</p>
                          <p className="text-xl font-bold text-gray-900">{instagramInsights.website_clicks?.toLocaleString() || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Connect your Instagram to see analytics</p>
                  </div>
                )}
              </div>
              
              {/* AI Insights */}
              {aiInsights.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    AI Insights
                  </h2>
                  <div className="space-y-4">
                    {aiInsights.map((insight, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border-l-4 ${
                        insight.priority === 'high' ? 'bg-red-50 border-red-500' :
                        insight.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-green-50 border-green-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <Badge className={`text-xs ${
                            insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                            insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        {insight.action_items && insight.action_items.length > 0 && (
                          <ul className="text-sm text-gray-500 list-disc list-inside">
                            {insight.action_items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Content Recommendations */}
              {contentRecommendations.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Content Recommendations
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {contentRecommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${
                            rec.type === 'reel' ? 'bg-purple-100 text-purple-700' :
                            rec.type === 'story' ? 'bg-pink-100 text-pink-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {rec.type}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{rec.topic}</h4>
                        <p className="text-xs text-gray-500 mb-2">Best time: {rec.best_time}</p>
                        <p className="text-sm text-gray-600 italic">&ldquo;{rec.caption_suggestion}&rdquo;</p>
                        {rec.hashtags && rec.hashtags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {rec.hashtags.slice(0, 5).map((tag, i) => (
                              <span key={i} className="text-xs text-pink-600">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Posts */}
              {recentPosts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts Performance</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {recentPosts.slice(0, 12).map((post, idx) => (
                      <a 
                        key={idx} 
                        href={post.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {post.media_url && (
                          <img 
                            src={post.thumbnail_url || post.media_url} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center text-xs">
                            <p className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.like_count || 0}</p>
                            <p className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments_count || 0}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'support' ? (
            /* Support Tab */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Support Ticket</h2>
                {ticketSuccess && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Ticket submitted successfully! We&apos;ll get back to you soon.
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <Input 
                      type="text" 
                      className="w-full"
                      placeholder="What do you need help with?"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea 
                      className="w-full px-4 py-2 border rounded-lg h-32 resize-none"
                      placeholder="Describe your issue..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleSubmitTicket}
                    disabled={submittingTicket || !ticketSubject || !ticketMessage}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                  >
                    {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
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
                      <Input 
                        type="text" 
                        className="w-full"
                        value={userSettings.name}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input 
                        type="email" 
                        className="w-full bg-gray-50"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="bg-gray-900 text-white"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
              
              {/* Two-Factor Authentication */}
              <TwoFactorSettings />
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-pink-500" />
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-900 font-medium">Email Notifications</span>
                      <p className="text-xs text-gray-500">Receive emails about your account activity</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.email_notifications}
                      onChange={(e) => handleNotifPrefChange('email_notifications', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-900 font-medium">Growth Milestone Alerts</span>
                      <p className="text-xs text-gray-500">Get notified when you reach follower milestones</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.growth_milestone_alerts}
                      onChange={(e) => handleNotifPrefChange('growth_milestone_alerts', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-900 font-medium">Weekly Reports</span>
                      <p className="text-xs text-gray-500">Receive AI-powered weekly growth reports</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.weekly_reports}
                      onChange={(e) => handleNotifPrefChange('weekly_reports', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-900 font-medium">Security Alerts</span>
                      <p className="text-xs text-gray-500">Important security notifications (recommended)</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.security_alerts}
                      onChange={(e) => handleNotifPrefChange('security_alerts', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-900 font-medium">Billing Alerts</span>
                      <p className="text-xs text-gray-500">Payment and subscription notifications</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.billing_alerts}
                      onChange={(e) => handleNotifPrefChange('billing_alerts', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-900 font-medium">New Features</span>
                      <p className="text-xs text-gray-500">Updates about new features and improvements</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.new_features}
                      onChange={(e) => handleNotifPrefChange('new_features', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-gray-900 font-medium">Tips & Tricks</span>
                      <p className="text-xs text-gray-500">Instagram growth tips and best practices</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationPrefs.tips_and_tricks}
                      onChange={(e) => handleNotifPrefChange('tips_and_tricks', e.target.checked)}
                      className="w-5 h-5 rounded accent-pink-500" 
                    />
                  </div>
                  <Button 
                    onClick={handleSaveNotificationPrefs}
                    disabled={savingNotifPrefs}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white mt-4"
                  >
                    {savingNotifPrefs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6 border-red-200">
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
                      <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-sm">{instagramAccount ? 'Connected Account' : 'No account connected'}</p>
                        {instagramAccount && !instagramAccount.oauth_connected && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                            Demo Mode
                          </span>
                        )}
                        {instagramAccount && instagramAccount.oauth_connected && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                            Live Data
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isGrowthActive && instagramAccount ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                      <span className="text-white text-sm">
                        {!instagramAccount ? 'Connect to Start' : isGrowthActive ? 'AI Growth Engine Active' : 'Growth Paused'}
                      </span>
                    </div>
                    {instagramAccount && (
                      <Button
                        onClick={handleRefreshData}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 rounded-full"
                        disabled={refreshingData}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshingData ? 'animate-spin' : ''}`} />
                        {refreshingData ? 'Refreshing...' : 'Refresh Data'}
                      </Button>
                    )}
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

              {/* Demo Mode Info Banner */}
              {instagramAccount && !instagramAccount.oauth_connected && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Demo Mode - Simulated Data</p>
                      <p className="text-xs text-gray-600">
                        Stats shown are simulated for demonstration. To get real Instagram data, Meta API approval is required (takes 2-4 weeks).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Data Banner - OAuth Connected */}
              {instagramAccount && instagramAccount.oauth_connected && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Live Instagram Data</p>
                      <p className="text-xs text-gray-600">
                        Connected to Instagram API. Click Refresh Data to update your stats.
                      </p>
                    </div>
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

              {/* Plan Growth Progress Card - Shows after user buys a plan */}
              {subscription && subscription.status === 'active' && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">{subscription.plan} Plan Progress</h3>
                        <p className="text-sm text-gray-600">
                          {subscription.growth_complete 
                            ? 'Target reached! Your plan is complete.' 
                            : 'Working towards your follower target'}
                        </p>
                      </div>
                    </div>
                    {subscription.growth_complete ? (
                      <Badge className="bg-green-500 text-white px-4 py-2">
                        <CheckCircle className="w-4 h-4 mr-2" /> Complete!
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2">In Progress</Badge>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    {(() => {
                      // Calculate progress based on plan targets
                      const planTargets = {
                        starter: { min: 1000, max: 1500 },
                        growth: { min: 2500, max: 5000 },
                        pro: { min: 5000, max: 10000 },
                        elite: { min: 10000, max: 25000 },
                        business: { min: 25000, max: 50000 }
                      };
                      
                      const planTarget = planTargets[subscription.plan?.toLowerCase()] || { min: 1000, max: 1500 };
                      const targetFollowers = planTarget.max;
                      const startFollowers = subscription.start_followers || 0;
                      const currentFollowers = instagramAccount?.followers_count || startFollowers;
                      const gained = Math.max(0, currentFollowers - startFollowers);
                      const progress = Math.min(100, Math.round((gained / targetFollowers) * 100));
                      
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">
                              <span className="font-semibold text-green-600">+{gained.toLocaleString()}</span> followers gained
                            </span>
                            <span className="text-gray-600">
                              Target: <span className="font-semibold">{targetFollowers.toLocaleString()}</span>
                            </span>
                          </div>
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                progress >= 100 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : 'bg-gradient-to-r from-pink-500 to-purple-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Started: {startFollowers.toLocaleString()} followers
                            </span>
                            <span className={`text-sm font-bold ${progress >= 100 ? 'text-green-600' : 'text-purple-600'}`}>
                              {progress}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Milestones */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {[25, 50, 75, 100].map((milestone) => {
                      const planTargets = {
                        starter: 1500, growth: 5000, pro: 10000, elite: 25000, business: 50000
                      };
                      const target = planTargets[subscription.plan?.toLowerCase()] || 1500;
                      const startFollowers = subscription.start_followers || 0;
                      const currentFollowers = instagramAccount?.followers_count || startFollowers;
                      const gained = currentFollowers - startFollowers;
                      const progress = Math.min(100, Math.round((gained / target) * 100));
                      const reached = progress >= milestone;
                      
                      return (
                        <div 
                          key={milestone} 
                          className={`text-center p-2 rounded-lg ${reached ? 'bg-green-100' : 'bg-gray-100'}`}
                        >
                          <div className={`text-lg font-bold ${reached ? 'text-green-600' : 'text-gray-400'}`}>
                            {reached ? <CheckCircle className="w-5 h-5 mx-auto" /> : `${milestone}%`}
                          </div>
                          <p className="text-xs text-gray-500">{Math.round(target * milestone / 100).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-pink-600 hover:text-pink-700"
                      onClick={() => handleTabChange('targeting')}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {targetSettings.map((setting) => (
                      <div key={setting.label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-500">{setting.label}</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[150px] truncate">{setting.value}</span>
                      </div>
                    ))}
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

              {/* AI Insights Card */}
              {aiAnalysis && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">AI Analysis Insights</h3>
                        <p className="text-sm text-gray-500">Powered by Adverlyx Intelligence</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      {aiAnalysis.confidence_level || 'Medium'} Confidence
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Analysis Summary */}
                    <div className="p-4 bg-white/70 rounded-lg">
                      <p className="text-sm text-gray-700">{aiAnalysis.analysis_summary || 'AI has analyzed your profile and optimized your targeting settings.'}</p>
                    </div>
                    
                    {/* Key Insights Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Detected Niche</p>
                        <p className="font-medium text-gray-900 capitalize">{aiAnalysis.niche || 'General'}</p>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Suggested Plan</p>
                        <p className="font-medium text-gray-900 capitalize">{aiAnalysis.suggested_plan || 'Growth'}</p>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Growth Intensity</p>
                        <p className="font-medium text-gray-900 capitalize">{aiAnalysis.growth_intensity || 'Moderate'}</p>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Analyzed</p>
                        <p className="font-medium text-gray-900">{aiAnalysis.analyzed_at ? new Date(aiAnalysis.analyzed_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                    
                    {/* Growth Expectation */}
                    {aiAnalysis.growth_expectation && (
                      <div className="flex items-start gap-3 p-3 bg-green-50/70 rounded-lg border border-green-100">
                        <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700">{aiAnalysis.growth_expectation}</p>
                      </div>
                    )}
                    
                    {/* Plan Reason */}
                    {aiAnalysis.plan_reason && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                        <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">{aiAnalysis.plan_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
