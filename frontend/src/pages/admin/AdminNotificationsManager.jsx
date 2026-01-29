import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
  Bell, RefreshCw, Loader2, Send, Users, MessageSquare,
  BarChart3, Mail, AlertCircle, CheckCircle, Filter, Megaphone
} from 'lucide-react';

const AdminNotifications = () => {
  const [stats, setStats] = useState(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('send');
  
  // Broadcast form
  const [broadcast, setBroadcast] = useState({
    title: '',
    message: '',
    type: 'system',
    target: 'all',
    priority: 'normal'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Note: These endpoints will be available once we add them
      // For now, we'll use placeholder data
      setStats({
        total_sent: 156,
        sent_today: 23,
        sent_this_week: 89,
        read_rate: 67.5,
        by_type: {
          system: 45,
          payment: 32,
          growth: 28,
          promotion: 51
        }
      });
      setRecentBroadcasts([]);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) {
      alert('Please fill in title and message');
      return;
    }
    
    setSending(true);
    try {
      // This would call the actual API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(broadcast)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Broadcast sent to ${data.count} users!`);
        setBroadcast({
          title: '',
          message: '',
          type: 'system',
          target: 'all',
          priority: 'normal'
        });
        await loadData();
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const notificationTypes = [
    { value: 'system', label: 'System', color: 'blue' },
    { value: 'payment', label: 'Payment', color: 'green' },
    { value: 'subscription', label: 'Subscription', color: 'purple' },
    { value: 'growth', label: 'Growth', color: 'pink' },
    { value: 'support', label: 'Support', color: 'yellow' },
    { value: 'promotion', label: 'Promotion', color: 'orange' }
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'subscribers', label: 'Active Subscribers' },
    { value: 'Starter', label: 'Starter Plan' },
    { value: 'Pro', label: 'Pro Plan' },
    { value: 'Enterprise', label: 'Enterprise Plan' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="notifications-management-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-500">Send and manage push notifications</p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500">Total Sent</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_sent.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500">Sent Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.sent_today}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500">This Week</span>
            </div>
            <p className="text-2xl font-bold">{stats.sent_this_week}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-gray-500">Read Rate</span>
            </div>
            <p className="text-2xl font-bold">{stats.read_rate}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'send', label: 'Send Broadcast', icon: Megaphone },
          { key: 'history', label: 'History', icon: MessageSquare },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Send Broadcast Tab */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compose Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-gray-400" />
              Compose Broadcast
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  placeholder="Notification title..."
                  value={broadcast.title}
                  onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  placeholder="Notification message..."
                  value={broadcast.message}
                  onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {notificationTypes.map((type) => (
                    <Badge
                      key={type.value}
                      className={`cursor-pointer transition-colors ${
                        broadcast.type === type.value
                          ? `bg-${type.color}-500 text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setBroadcast({ ...broadcast, type: type.value })}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <select
                  value={broadcast.target}
                  onChange={(e) => setBroadcast({ ...broadcast, target: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  {targetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <div className="flex gap-2">
                  {['low', 'normal', 'high'].map((p) => (
                    <Badge
                      key={p}
                      className={`cursor-pointer capitalize ${
                        broadcast.priority === p
                          ? p === 'high' ? 'bg-red-500 text-white' : p === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setBroadcast({ ...broadcast, priority: p })}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleSendBroadcast}
                disabled={sending || !broadcast.title || !broadcast.message}
                className="w-full gap-2 bg-gradient-to-r from-pink-500 to-purple-500"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Broadcast
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      {broadcast.title || 'Notification Title'}
                    </p>
                    <span className="text-xs text-gray-400">Just now</span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {broadcast.message || 'Notification message will appear here...'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-gray-100 text-gray-600 text-xs">
                      {broadcast.type}
                    </Badge>
                    <Badge className={`text-xs ${
                      broadcast.priority === 'high' ? 'bg-red-100 text-red-600' :
                      broadcast.priority === 'low' ? 'bg-gray-100 text-gray-500' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {broadcast.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">Target: {
                    targetOptions.find(t => t.value === broadcast.target)?.label
                  }</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This broadcast will be sent to all users matching the selected criteria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Recent Broadcasts</h3>
          {recentBroadcasts.length > 0 ? (
            <div className="space-y-3">
              {recentBroadcasts.map((broadcast, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{broadcast._id?.title}</span>
                    <Badge>{broadcast.count} sent</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{broadcast._id?.created_at}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No broadcasts sent yet</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Notifications by Type</h3>
            <div className="space-y-3">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="capitalize font-medium">{type}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Engagement Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Open Rate</span>
                <span className="font-bold text-lg">{stats.read_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full" 
                  style={{ width: `${stats.read_rate}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Based on {stats.total_sent} notifications sent
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
