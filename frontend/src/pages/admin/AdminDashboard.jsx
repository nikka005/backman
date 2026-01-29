import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  LayoutDashboard, Users, CreditCard, Instagram, MessageSquare,
  Bell, Settings, LogOut, ChevronRight, TrendingUp, DollarSign,
  UserPlus, AlertCircle, Search, MoreVertical, Eye, Pause, Play,
  Loader2, RefreshCw, Package, Grid3X3, BarChart3, Megaphone, Sliders,
  Mail, Shield, Download, Brain
} from 'lucide-react';
import AdminSettings from './AdminSettings';
import AdminPlans from './AdminPlans';
import AdminFeatureMatrix from './AdminFeatureMatrix';
import AdminAnalytics from './AdminAnalytics';
import AdminPromotions from './AdminPromotions';
import FeatureManagement from './FeatureManagement';
import AdminEmailTemplates from './AdminEmailTemplates';
import AdminRateLimits from './AdminRateLimits';
import AdminExport from './AdminExport';
import AdminNotificationsManager from './AdminNotificationsManager';
import AdminAIIntelligence from './AdminAIIntelligence';

const AdminDashboard = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/backman');
      } else if (user?.role !== 'admin' && user?.role !== 'manager') {
        navigate('/backman');
      } else {
        loadDashboard();
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/backman');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Brain, label: 'AI Intelligence', path: '/admin/ai' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Megaphone, label: 'Promotions', path: '/admin/promotions' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Package, label: 'Plans', path: '/admin/plans' },
    { icon: Grid3X3, label: 'Feature Matrix', path: '/admin/feature-matrix' },
    { icon: Sliders, label: 'Feature Manager', path: '/admin/features' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
    { icon: Instagram, label: 'Instagram Accounts', path: '/admin/instagram' },
    { icon: MessageSquare, label: 'Support Tickets', path: '/admin/tickets' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: Mail, label: 'Email Templates', path: '/admin/email-templates' },
    { icon: Shield, label: 'Rate Limits', path: '/admin/rate-limits' },
    { icon: Download, label: 'Data Export', path: '/admin/export' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 flex flex-col">
        <div className="p-6 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <span className="text-xl font-bold">Adverlyx</span>
              <Badge className="ml-2 bg-pink-600 text-white text-xs">Admin</Badge>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check both exact match and nested paths (for feature manager)
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<DashboardOverview stats={stats} onRefresh={loadDashboard} />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
          <Route path="/promotions" element={<AdminPromotions />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/plans" element={<AdminPlans />} />
          <Route path="/feature-matrix" element={<AdminFeatureMatrix />} />
          <Route path="/features" element={<FeatureManagement />} />
          <Route path="/features/:featureType" element={<FeatureManagement />} />
          <Route path="/features/:featureType/:featureKey" element={<FeatureManagement />} />
          <Route path="/subscriptions" element={<SubscriptionsManagement />} />
          <Route path="/payments" element={<PaymentsManagement />} />
          <Route path="/instagram" element={<InstagramManagement />} />
          <Route path="/tickets" element={<TicketsManagement />} />
          <Route path="/notifications" element={<AdminNotificationsManager />} />
          <Route path="/email-templates" element={<AdminEmailTemplates />} />
          <Route path="/rate-limits" element={<AdminRateLimits />} />
          <Route path="/export" element={<AdminExport />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, onRefresh }) => {
  const statCards = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Subscriptions', value: stats.active_subscriptions, icon: CreditCard, color: 'from-green-500 to-emerald-500' },
    { label: 'MRR', value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: 'from-orange-500 to-pink-500' },
    { label: 'Open Tickets', value: stats.open_tickets, icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Overview of your platform</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Monthly Recurring Revenue</span>
                <span className="font-bold">${stats.mrr.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Annual Recurring Revenue</span>
                <span className="font-bold">${stats.arr.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold">${stats.total_revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Churn Rate</span>
                <span className={`font-bold ${stats.churn_rate > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.churn_rate}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Users</span>
                <span className="font-bold">{stats.total_users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-bold">{stats.active_users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Users (This Month)</span>
                <span className="font-bold text-green-500">+{stats.new_users_this_month}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Subscriptions</span>
                <span className="font-bold">{stats.total_subscriptions}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users Management Component
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ limit: 50, search: search || undefined });
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    try {
      await adminAPI.suspendUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await adminAPI.activateUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const response = await adminAPI.getUser(user.id);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Error loading user details:', error);
      setUserDetails(user);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={loadUsers}>
            Search
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Role</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Plan</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Instagram</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700' : user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {user.current_plan ? (
                      <Badge className="bg-purple-100 text-purple-700">{user.current_plan}</Badge>
                    ) : (
                      <span className="text-gray-400">No plan</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {user.instagram_username ? (
                      <span className="text-gray-600">@{user.instagram_username}</span>
                    ) : (
                      <span className="text-gray-400">Not connected</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      {user.status === 'suspended' ? (
                        <Button size="sm" variant="outline" onClick={() => handleActivate(user.id)} className="text-green-600">
                          <Play className="w-4 h-4 mr-1" /> Activate
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleSuspend(user.id)} className="text-red-600">
                          <Pause className="w-4 h-4 mr-1" /> Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-xl font-bold">User Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>✕</Button>
            </div>
            {loadingDetails ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : userDetails && (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {userDetails.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{userDetails.name}</h3>
                    <p className="text-gray-500">{userDetails.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={userDetails.status === 'active' ? 'bg-green-100 text-green-700 mt-1' : 'bg-red-100 text-red-700 mt-1'}>
                      {userDetails.status}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium mt-1 capitalize">{userDetails.role}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Current Plan</p>
                    <p className="font-medium mt-1 capitalize">{userDetails.current_plan || 'None'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Instagram</p>
                    <p className="font-medium mt-1">{userDetails.instagram_username ? `@${userDetails.instagram_username}` : 'Not connected'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium mt-1">{userDetails.created_at ? new Date(userDetails.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">2FA Enabled</p>
                    <p className="font-medium mt-1">{userDetails.two_factor_enabled ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {userDetails.subscription && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Subscription Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-500">Plan:</span> {userDetails.subscription.plan}</p>
                      <p><span className="text-gray-500">Billing:</span> {userDetails.subscription.billing_cycle}</p>
                      <p><span className="text-gray-500">Status:</span> {userDetails.subscription.status}</p>
                      <p><span className="text-gray-500">Amount:</span> ${userDetails.subscription.amount}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {userDetails.status === 'suspended' ? (
                    <Button onClick={() => { handleActivate(userDetails.id); setSelectedUser(null); }} className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" /> Activate User
                    </Button>
                  ) : (
                    <Button onClick={() => { handleSuspend(userDetails.id); setSelectedUser(null); }} variant="destructive">
                      <Pause className="w-4 h-4 mr-2" /> Suspend User
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Subscriptions Management Component
const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changePlanModal, setChangePlanModal] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    loadPlans();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSubscriptions();
      setSubscriptions(response.data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await adminAPI.getPlans(true);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleCancel = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await adminAPI.cancelSubscription(subscriptionId);
      loadSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const handleChangePlan = async () => {
    if (!changePlanModal || !selectedPlan) return;
    setChangingPlan(true);
    try {
      await adminAPI.changePlan(changePlanModal.id, selectedPlan);
      setChangePlanModal(null);
      setSelectedPlan('');
      loadSubscriptions();
      alert('Plan changed successfully!');
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan');
    } finally {
      setChangingPlan(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500">Manage user subscriptions and plans</p>
        </div>
        <Button onClick={loadSubscriptions} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Plan</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Billing</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Started</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-gray-100">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{sub.user_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{sub.user_email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className="bg-purple-100 text-purple-700 capitalize">{sub.plan}</Badge>
                  </td>
                  <td className="py-4 px-6 capitalize">{sub.billing_cycle}</td>
                  <td className="py-4 px-6 font-medium">${sub.amount?.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <Badge className={sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {sub.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { setChangePlanModal(sub); setSelectedPlan(sub.plan); }}>
                            Change Plan
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancel(sub.id)}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No subscriptions found</p>
        </div>
      )}

      {/* Change Plan Modal */}
      {changePlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setChangePlanModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Change Plan</h2>
              <Button variant="ghost" size="sm" onClick={() => setChangePlanModal(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">User</p>
                <p className="font-medium">{changePlanModal.user_name || changePlanModal.user_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                <Badge className="bg-purple-100 text-purple-700 capitalize">{changePlanModal.plan}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.name?.toLowerCase()}>
                      {plan.name} - ${plan.monthly_price}/mo
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setChangePlanModal(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500" 
                  onClick={handleChangePlan}
                  disabled={changingPlan || selectedPlan === changePlanModal.plan}
                >
                  {changingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Change Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Payments Management Component
const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, pending: 0 });
  const [refundModal, setRefundModal] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPayments();
      const paymentList = response.data || [];
      setPayments(paymentList);
      
      // Calculate stats
      const now = new Date();
      const thisMonth = paymentList.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      });
      
      setStats({
        total: paymentList.reduce((sum, p) => sum + (p.amount || 0), 0),
        thisMonth: thisMonth.reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: paymentList.filter(p => p.status === 'pending').length
      });
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setProcessingRefund(true);
    try {
      const amount = parseFloat(refundAmount) || refundModal.amount;
      await adminAPI.processRefund(refundModal.id, { amount, reason: refundReason });
      setRefundModal(null);
      setRefundAmount('');
      setRefundReason('');
      loadPayments();
      alert('Refund processed successfully!');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">View payment transactions</p>
        </div>
        <Button onClick={loadPayments} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : payments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Method</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-gray-100">
                  <td className="py-4 px-6 text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <p className="font-medium">{payment.user_name || payment.user_email || 'Unknown'}</p>
                  </td>
                  <td className="py-4 px-6 font-medium">${payment.amount?.toFixed(2)} {payment.currency?.toUpperCase()}</td>
                  <td className="py-4 px-6 capitalize">{payment.provider || payment.payment_method || 'Card'}</td>
                  <td className="py-4 px-6">
                    <Badge className={
                      payment.status === 'success' || payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      payment.status === 'refunded' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                    }>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {(payment.status === 'success' || payment.status === 'paid') && !payment.refunded && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-orange-600"
                        onClick={() => { setRefundModal(payment); setRefundAmount(payment.amount?.toString() || ''); }}
                      >
                        Refund
                      </Button>
                    )}
                    {payment.status === 'refunded' && (
                      <span className="text-sm text-gray-400">Refunded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No payments yet</p>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRefundModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Process Refund</h2>
              <Button variant="ghost" size="sm" onClick={() => setRefundModal(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Original Payment</p>
                <p className="font-medium">{refundModal.user_name || refundModal.user_email}</p>
                <p className="text-lg font-bold text-green-600">${refundModal.amount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Refund Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  max={refundModal.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                />
                <p className="text-xs text-gray-500 mt-1">Max: ${refundModal.amount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refund..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setRefundModal(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-orange-500 hover:bg-orange-600" 
                  onClick={handleRefund}
                  disabled={processingRefund || !refundAmount || parseFloat(refundAmount) <= 0}
                >
                  {processingRefund ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Process Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Instagram Management Component
const InstagramManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getInstagramAccounts();
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading Instagram accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGrowth = async (accountId, currentPaused) => {
    try {
      await adminAPI.updateInstagramAccount(accountId, { growth_paused: !currentPaused });
      loadAccounts();
    } catch (error) {
      console.error('Error toggling growth:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instagram Accounts</h1>
          <p className="text-gray-500">Manage connected Instagram accounts</p>
        </div>
        <Button onClick={loadAccounts} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Instagram className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold">@{account.username}</p>
                  <p className="text-sm text-gray-500">{account.user_name || 'User'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Followers</span>
                  <span className="font-medium">{(account.followers_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gained</span>
                  <span className="font-medium text-green-600">+{(account.total_followers_gained || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Engagement</span>
                  <span className="font-medium">{account.engagement_rate || 0}%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <Badge className={account.growth_paused ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}>
                  {account.growth_paused ? 'Paused' : 'Active'}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleGrowth(account.id, account.growth_paused)}
                >
                  {account.growth_paused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                  {account.growth_paused ? 'Resume' : 'Pause'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No Instagram accounts connected</p>
        </div>
      )}
    </div>
  );
};

// Tickets Management Component
const TicketsManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTickets();
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      await adminAPI.updateTicket(ticketId, { status });
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      await adminAPI.updateTicket(selectedTicket.id, { 
        admin_response: replyMessage,
        status: 'in_progress'
      });
      setReplyMessage('');
      loadTickets();
      // Update selected ticket
      setSelectedTicket(prev => ({
        ...prev,
        admin_response: replyMessage,
        status: 'in_progress'
      }));
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500">Manage customer support requests</p>
        </div>
        <Button onClick={loadTickets} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : tickets.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Subject</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Priority</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Created</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-gray-100">
                  <td className="py-4 px-6">
                    <p className="font-medium">{ticket.subject}</p>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{ticket.user_email}</td>
                  <td className="py-4 px-6">
                    <Badge className={
                      ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }>
                      {ticket.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <select 
                        value={ticket.status}
                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No support tickets</p>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500">Ticket #{selectedTicket.id?.slice(0, 8)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={
                    selectedTicket.status === 'open' ? 'bg-blue-100 text-blue-700 mt-1' :
                    selectedTicket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 mt-1' :
                    selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700 mt-1' : 'bg-gray-100 text-gray-700 mt-1'
                  }>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Priority</p>
                  <Badge className={
                    selectedTicket.priority === 'high' ? 'bg-red-100 text-red-700 mt-1' :
                    selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 mt-1' : 'bg-gray-100 text-gray-700 mt-1'
                  }>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium text-sm mt-1">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">From</p>
                <p className="text-gray-600">{selectedTicket.user_email}</p>
              </div>

              {/* Message */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Message</p>
                <div className="bg-blue-50 rounded-xl p-4 text-gray-700">
                  {selectedTicket.message || selectedTicket.description || 'No message content'}
                </div>
              </div>

              {/* Previous Response */}
              {selectedTicket.admin_response && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Previous Response</p>
                  <div className="bg-green-50 rounded-xl p-4 text-gray-700">
                    {selectedTicket.admin_response}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Reply to Customer</p>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full p-3 border rounded-xl resize-none h-32"
                  placeholder="Type your response here..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                  onClick={sendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                >
                  {sendingReply ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reply
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { updateStatus(selectedTicket.id, 'resolved'); setSelectedTicket(null); }}
                  className="text-green-600"
                >
                  Mark Resolved
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Notifications Management Component
const NotificationsManagement = () => {
  const [title, setTitle] = useState('');
  const [message, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const sendNotification = async () => {
    if (!title || !message) return;
    try {
      setSending(true);
      await adminAPI.sendNotification({ title, message, target: 'all' });
      setTitle('');
      setMsg('');
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500">Send announcements to users</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Send Announcement</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Write your message..."
              className="w-full px-3 py-2 border rounded-lg resize-none h-32"
            />
          </div>
          <Button onClick={sendNotification} disabled={sending || !title || !message} className="w-full">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Send to All Users
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
