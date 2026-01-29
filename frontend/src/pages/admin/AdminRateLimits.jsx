import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Shield, RefreshCw, Loader2, Ban, CheckCircle, AlertTriangle,
  Activity, Clock, Globe, Zap, Lock, Unlock, BarChart3
} from 'lucide-react';

const AdminRateLimits = () => {
  const [stats, setStats] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [blockIP, setBlockIP] = useState('');
  const [blockHours, setBlockHours] = useState(24);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, configsRes, blockedRes] = await Promise.all([
        adminAPI.getRateLimitStats(),
        adminAPI.getRateLimitConfig(),
        adminAPI.getBlockedIPs()
      ]);
      setStats(statsRes.data);
      setConfigs(configsRes.data || []);
      setBlockedIPs(blockedRes.data || []);
    } catch (error) {
      console.error('Error loading rate limit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ip) => {
    if (!window.confirm(`Unblock ${ip}?`)) return;
    try {
      await adminAPI.unblockIP(ip);
      await loadData();
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  const handleBlockIP = async () => {
    if (!blockIP) return;
    try {
      await adminAPI.blockIP(blockIP, blockHours, blockReason || 'Manual block');
      setBlockIP('');
      setBlockReason('');
      await loadData();
      alert(`IP ${blockIP} blocked for ${blockHours} hours`);
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  const handleUpdateConfig = async (key, field, value) => {
    const config = configs.find(c => c.endpoint_key === key);
    if (!config) return;
    
    try {
      await adminAPI.updateRateLimitConfig(key, {
        ...config,
        [field]: value
      });
      await loadData();
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all rate limits to default values?')) return;
    try {
      await adminAPI.resetRateLimitsToDefault();
      await loadData();
      alert('Rate limits reset to defaults');
    } catch (error) {
      console.error('Error resetting defaults:', error);
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
    <div data-testid="rate-limits-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Limits Dashboard</h1>
          <p className="text-gray-500">Monitor and configure API rate limiting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleResetDefaults} variant="outline" className="gap-2">
            Reset Defaults
          </Button>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500">Requests Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.requests_today.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500">Last Hour</span>
            </div>
            <p className="text-2xl font-bold">{stats.requests_last_hour.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-gray-500">Blocked Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.blocked_today.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-500">Block Rate</span>
            </div>
            <p className="text-2xl font-bold">{stats.block_rate}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'config', label: 'Configuration', icon: Zap },
          { key: 'blocked', label: 'Blocked IPs', icon: Ban },
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

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Endpoint */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Requests by Endpoint</h3>
            <div className="space-y-3">
              {stats.by_endpoint.length > 0 ? (
                stats.by_endpoint.map((item) => (
                  <div key={item.endpoint} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{item.endpoint}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{item.total} requests</span>
                      {item.blocked > 0 && (
                        <Badge className="bg-red-100 text-red-700">{item.blocked} blocked</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No requests recorded yet</p>
              )}
            </div>
          </div>

          {/* Top Blocked IPs */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Top Blocked IPs Today</h3>
            <div className="space-y-3">
              {stats.top_blocked_ips.length > 0 ? (
                stats.top_blocked_ips.map((item, index) => (
                  <div key={item.ip} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-mono">{item.ip}</span>
                    </div>
                    <Badge className="bg-red-100 text-red-700">{item.count} blocks</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No blocked IPs today</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Endpoint</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Max Requests</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Window (sec)</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Block Duration</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.endpoint_key} className="border-t border-gray-100">
                  <td className="py-4 px-6">
                    <span className="font-medium">{config.endpoint_key}</span>
                  </td>
                  <td className="py-4 px-6">
                    <Input
                      type="number"
                      value={config.max_requests}
                      onChange={(e) => handleUpdateConfig(config.endpoint_key, 'max_requests', parseInt(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <Input
                      type="number"
                      value={config.window_seconds}
                      onChange={(e) => handleUpdateConfig(config.endpoint_key, 'window_seconds', parseInt(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <Input
                      type="number"
                      value={config.block_duration_seconds}
                      onChange={(e) => handleUpdateConfig(config.endpoint_key, 'block_duration_seconds', parseInt(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={config.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'blocked' && (
        <div className="space-y-6">
          {/* Manual Block */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              Block IP Manually
            </h3>
            <div className="flex items-center gap-4">
              <Input
                placeholder="IP Address (e.g., 192.168.1.1)"
                value={blockIP}
                onChange={(e) => setBlockIP(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Hours"
                value={blockHours}
                onChange={(e) => setBlockHours(parseInt(e.target.value))}
                className="w-24"
              />
              <Input
                placeholder="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleBlockIP} disabled={!blockIP} className="gap-2 bg-red-600 hover:bg-red-700">
                <Ban className="w-4 h-4" />
                Block IP
              </Button>
            </div>
          </div>

          {/* Blocked IPs List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Currently Blocked IPs ({blockedIPs.length})</h3>
            {blockedIPs.length > 0 ? (
              <div className="space-y-3">
                {blockedIPs.map((ip) => (
                  <div key={ip.ip_address} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono font-medium">{ip.ip_address}</p>
                      <p className="text-sm text-gray-500">
                        Blocked until: {new Date(ip.blocked_until).toLocaleString()}
                        {ip.reason && ` • Reason: ${ip.reason}`}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUnblockIP(ip.ip_address)}
                      className="gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No IPs currently blocked</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRateLimits;
