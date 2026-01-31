import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  LayoutDashboard, Users, CreditCard, MessageSquare,
  Bell, Settings, LogOut, DollarSign,
  Loader2, RefreshCw, Package, Grid3X3, BarChart3, Megaphone, Sliders,
  Mail, Shield, Download, Brain, Gift, Share2, Tag, Book, Server, Instagram, FileText
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
import AdminPrograms from './AdminPrograms';
import AdminSocialLinks from './AdminSocialLinks';
import AdminCoupons from './AdminCoupons';
import AdminDocumentation from './AdminDocumentation';
import AdminInstagramUsers from './AdminInstagramUsers';
import AdminEmailSettings from './AdminEmailSettings';
import AdminUsersManagement from './AdminUsersManagement';
import AdminSubscriptionsManagement from './AdminSubscriptionsManagement';
import AdminPaymentsManagement from './AdminPaymentsManagement';
import AdminTicketsManagement from './AdminTicketsManagement';
import AdminWeeklyReports from './AdminWeeklyReports';

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
    { icon: Gift, label: 'Partner Programs', path: '/admin/programs' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Package, label: 'Plans', path: '/admin/plans' },
    { icon: Grid3X3, label: 'Feature Matrix', path: '/admin/feature-matrix' },
    { icon: Sliders, label: 'Feature Manager', path: '/admin/features' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
    { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
    { icon: Instagram, label: 'Instagram Accounts', path: '/admin/instagram' },
    { icon: MessageSquare, label: 'Support Tickets', path: '/admin/tickets' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: Mail, label: 'Email Templates', path: '/admin/email-templates' },
    { icon: Server, label: 'Email Server', path: '/admin/email-settings' },
    { icon: Shield, label: 'Rate Limits', path: '/admin/rate-limits' },
    { icon: Download, label: 'Data Export', path: '/admin/export' },
    { icon: FileText, label: 'Weekly Reports', path: '/admin/weekly-reports' },
    { icon: Share2, label: 'Social Links', path: '/admin/social-links' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
    { icon: Book, label: 'Documentation', path: '/admin/docs' },
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
          <Route path="/ai" element={<AdminAIIntelligence />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
          <Route path="/promotions" element={<AdminPromotions />} />
          <Route path="/programs" element={<AdminPrograms />} />
          <Route path="/users" element={<AdminUsersManagement />} />
          <Route path="/plans" element={<AdminPlans />} />
          <Route path="/feature-matrix" element={<AdminFeatureMatrix />} />
          <Route path="/features" element={<FeatureManagement />} />
          <Route path="/features/:featureType" element={<FeatureManagement />} />
          <Route path="/features/:featureType/:featureKey" element={<FeatureManagement />} />
          <Route path="/subscriptions" element={<AdminSubscriptionsManagement />} />
          <Route path="/payments" element={<AdminPaymentsManagement />} />
          <Route path="/coupons" element={<AdminCoupons />} />
          <Route path="/instagram" element={<AdminInstagramUsers />} />
          <Route path="/tickets" element={<AdminTicketsManagement />} />
          <Route path="/notifications" element={<AdminNotificationsManager />} />
          <Route path="/email-templates" element={<AdminEmailTemplates />} />
          <Route path="/email-settings" element={<AdminEmailSettings />} />
          <Route path="/rate-limits" element={<AdminRateLimits />} />
          <Route path="/export" element={<AdminExport />} />
          <Route path="/social-links" element={<AdminSocialLinks />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/docs" element={<AdminDocumentation />} />
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
    <div data-testid="admin-dashboard-overview">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Overview of your platform</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="gap-2" data-testid="refresh-dashboard-btn">
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

export default AdminDashboard;
