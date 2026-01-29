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
  Loader2, RefreshCw, Package
} from 'lucide-react';
import AdminSettings from './AdminSettings';
import AdminPlans from './AdminPlans';

const AdminDashboard = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (user?.role !== 'admin' && user?.role !== 'manager') {
        navigate('/dashboard');
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
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Package, label: 'Plans', path: '/admin/plans' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
    { icon: Instagram, label: 'Instagram Accounts', path: '/admin/instagram' },
    { icon: MessageSquare, label: 'Support Tickets', path: '/admin/tickets' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
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
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50">
        <div className="p-6">
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

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
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

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<DashboardOverview stats={stats} onRefresh={loadDashboard} />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/plans" element={<AdminPlans />} />
          <Route path="/subscriptions" element={<SubscriptionsManagement />} />
          <Route path="/payments" element={<PaymentsManagement />} />
          <Route path="/instagram" element={<InstagramManagement />} />
          <Route path="/tickets" element={<TicketsManagement />} />
          <Route path="/notifications" element={<NotificationsManagement />} />
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
    </div>
  );
};

// Placeholder components for other routes
const SubscriptionsManagement = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h1>
    <p className="text-gray-500 mb-8">Manage user subscriptions and plans</p>
    <div className="bg-white rounded-xl p-8 text-center">
      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Subscription management features coming soon</p>
    </div>
  </div>
);

const PaymentsManagement = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments</h1>
    <p className="text-gray-500 mb-8">View and manage payments</p>
    <div className="bg-white rounded-xl p-8 text-center">
      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Payment management features coming soon</p>
    </div>
  </div>
);

const InstagramManagement = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Instagram Accounts</h1>
    <p className="text-gray-500 mb-8">Manage connected Instagram accounts</p>
    <div className="bg-white rounded-xl p-8 text-center">
      <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Instagram management features coming soon</p>
    </div>
  </div>
);

const TicketsManagement = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Tickets</h1>
    <p className="text-gray-500 mb-8">Manage support tickets</p>
    <div className="bg-white rounded-xl p-8 text-center">
      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Ticket management features coming soon</p>
    </div>
  </div>
);

const NotificationsManagement = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
    <p className="text-gray-500 mb-8">Send announcements and notifications</p>
    <div className="bg-white rounded-xl p-8 text-center">
      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Notification features coming soon</p>
    </div>
  </div>
);

export default AdminDashboard;
