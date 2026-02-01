import React, { useState, useEffect } from 'react';
import { renewalsAPI, invoicesAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  RefreshCw, Loader2, Calendar, DollarSign, CheckCircle, 
  AlertTriangle, Play, Settings, FileText, Download, Clock
} from 'lucide-react';

const AdminRenewalsManagement = () => {
  const [dueRenewals, setDueRenewals] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('due');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dueRes, upcomingRes, historyRes, settingsRes] = await Promise.all([
        renewalsAPI.getDueRenewals(),
        renewalsAPI.getUpcomingRenewals(14),
        renewalsAPI.getRenewalHistory(null, 20),
        renewalsAPI.getSettings()
      ]);
      setDueRenewals(dueRes.data.subscriptions || []);
      setUpcomingRenewals(upcomingRes.data.subscriptions || []);
      setHistory(historyRes.data.renewals || []);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading renewals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSingle = async (subscriptionId) => {
    setProcessing(true);
    try {
      await renewalsAPI.processRenewal(subscriptionId);
      alert('Renewal processed successfully!');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process renewal');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    if (!confirm(`Process ${dueRenewals.length} due renewals?`)) return;
    setProcessing(true);
    try {
      const result = await renewalsAPI.processAllDue();
      alert(`Processed ${result.data.successful} of ${result.data.processed} renewals`);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process renewals');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await renewalsAPI.updateSettings(settings);
      alert('Settings saved!');
      setShowSettings(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save settings');
    }
  };

  const tabs = [
    { id: 'due', label: 'Due Now', count: dueRenewals.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingRenewals.length },
    { id: 'history', label: 'History', count: history.length }
  ];

  return (
    <div data-testid="admin-renewals-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Renewals</h1>
          <p className="text-gray-500">Manage automatic subscription renewals</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowSettings(true)} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Now</p>
              <p className="text-2xl font-bold">{dueRenewals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upcoming (14 days)</p>
              <p className="text-2xl font-bold">{upcomingRenewals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Auto-Renewal</p>
              <p className="text-2xl font-bold">{settings?.auto_renewal_enabled ? 'ON' : 'OFF'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Grace Period</p>
              <p className="text-2xl font-bold">{settings?.grace_period_days || 7} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {dueRenewals.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{dueRenewals.length} Renewals Due</h3>
              <p className="text-pink-100">Process all due renewals automatically</p>
            </div>
            <Button
              onClick={handleProcessAll}
              disabled={processing}
              className="bg-white text-pink-600 hover:bg-pink-50"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Process All Due
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {activeTab === 'due' && (
            <RenewalsList
              renewals={dueRenewals}
              onProcess={handleProcessSingle}
              processing={processing}
              type="due"
            />
          )}
          {activeTab === 'upcoming' && (
            <RenewalsList
              renewals={upcomingRenewals}
              onProcess={handleProcessSingle}
              processing={processing}
              type="upcoming"
            />
          )}
          {activeTab === 'history' && (
            <HistoryList history={history} />
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && settings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Renewal Settings</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span>Auto-Renewal Enabled</span>
                <input
                  type="checkbox"
                  checked={settings.auto_renewal_enabled}
                  onChange={(e) => setSettings({...settings, auto_renewal_enabled: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Retry Attempts</label>
                <input
                  type="number"
                  value={settings.max_retry_attempts}
                  onChange={(e) => setSettings({...settings, max_retry_attempts: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Retry Interval (days)</label>
                <input
                  type="number"
                  value={settings.retry_interval_days}
                  onChange={(e) => setSettings({...settings, retry_interval_days: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Grace Period (days)</label>
                <input
                  type="number"
                  value={settings.grace_period_days}
                  onChange={(e) => setSettings({...settings, grace_period_days: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <Button onClick={handleSaveSettings} className="w-full">Save Settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RenewalsList = ({ renewals, onProcess, processing, type }) => {
  if (renewals.length === 0) {
    return (
      <div className="p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No {type} renewals</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Plan</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Next Billing</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody>
        {renewals.map((renewal) => (
          <tr key={renewal.id} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="py-4 px-6">
              <p className="font-medium">{renewal.user_id?.slice(0, 8)}...</p>
            </td>
            <td className="py-4 px-6">
              <Badge className="bg-pink-100 text-pink-700 capitalize">{renewal.plan}</Badge>
            </td>
            <td className="py-4 px-6 font-medium">${renewal.amount?.toFixed(2) || '0.00'}</td>
            <td className="py-4 px-6 text-gray-500">
              {renewal.next_billing_date ? new Date(renewal.next_billing_date).toLocaleDateString() : 'N/A'}
            </td>
            <td className="py-4 px-6">
              {type === 'due' && (
                <Button
                  size="sm"
                  onClick={() => onProcess(renewal.id)}
                  disabled={processing}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process'}
                </Button>
              )}
              {type === 'upcoming' && (
                <span className="text-sm text-gray-400">Scheduled</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const HistoryList = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No renewal history</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Subscription</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
          <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
        </tr>
      </thead>
      <tbody>
        {history.map((item) => (
          <tr key={item.id} className="border-t border-gray-100">
            <td className="py-4 px-6 text-gray-500">
              {new Date(item.created_at).toLocaleDateString()}
            </td>
            <td className="py-4 px-6">
              <p className="font-medium">{item.subscription_id?.slice(0, 12)}...</p>
            </td>
            <td className="py-4 px-6 font-medium">${item.amount?.toFixed(2)}</td>
            <td className="py-4 px-6">
              <Badge className={
                item.status === 'success' ? 'bg-green-100 text-green-700' :
                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }>
                {item.status}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminRenewalsManagement;
