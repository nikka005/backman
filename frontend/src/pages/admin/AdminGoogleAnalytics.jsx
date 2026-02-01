import React, { useState, useEffect } from 'react';
import { googleAnalyticsAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  BarChart3, RefreshCw, Loader2, Upload, Check, AlertCircle,
  Eye, Users, Clock, Globe, TrendingUp, FileText, Trash2
} from 'lucide-react';

const AdminGoogleAnalytics = () => {
  const [credStatus, setCredStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [period, setPeriod] = useState(30);
  
  // Upload form
  const [propertyId, setPropertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [credFile, setCredFile] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, dashRes] = await Promise.all([
        googleAnalyticsAPI.getCredentialsStatus(),
        googleAnalyticsAPI.getDashboard(period)
      ]);
      setCredStatus(statusRes.data);
      setDashboardData(dashRes.data);
    } catch (error) {
      console.error('Error loading GA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!credFile || !propertyId || !propertyName) {
      alert('Please fill all fields');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', credFile);
      formData.append('property_id', propertyId);
      formData.append('property_name', propertyName);
      
      await googleAnalyticsAPI.uploadCredentials(formData);
      alert('GA4 credentials uploaded successfully!');
      setPropertyId('');
      setPropertyName('');
      setCredFile(null);
      loadData();
    } catch (error) {
      console.error('Error uploading:', error);
      alert(error.response?.data?.detail || 'Failed to upload credentials');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete GA4 credentials? This will disable real analytics data.')) return;
    try {
      await googleAnalyticsAPI.deleteCredentials();
      loadData();
    } catch (error) {
      alert('Failed to delete credentials');
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
    <div data-testid="admin-google-analytics">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Analytics</h1>
          <p className="text-gray-500">Connect GA4 for real traffic data</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-6 mb-8 ${credStatus?.configured ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {credStatus?.configured ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {credStatus?.configured ? 'GA4 Connected' : 'GA4 Not Configured'}
              </h3>
              {credStatus?.configured ? (
                <p className="text-gray-600">
                  Property: <strong>{credStatus.property_name}</strong> ({credStatus.property_id})
                </p>
              ) : (
                <p className="text-gray-600">Upload your GA4 service account credentials to get real traffic data</p>
              )}
            </div>
          </div>
          {credStatus?.configured && (
            <Button variant="outline" className="text-red-600 border-red-200" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Upload Form (if not configured) */}
      {!credStatus?.configured && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h3 className="font-semibold text-lg mb-4">Configure GA4 Credentials</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">GA4 Property ID</label>
                <Input
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="e.g., 123456789"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property Name</label>
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g., Adverlyx Website"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Service Account JSON File</label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setCredFile(e.target.files[0])}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Download from Google Cloud Console → IAM → Service Accounts → Keys
              </p>
            </div>
            <Button type="submit" disabled={uploading} className="bg-pink-500 hover:bg-pink-600">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Credentials
            </Button>
          </form>
        </div>
      )}

      {/* Analytics Dashboard */}
      {dashboardData?.configured && !dashboardData?.error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Eye}
              label="Page Views"
              value={dashboardData.page_views?.total?.toLocaleString() || 0}
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={Users}
              label="Unique Users"
              value={dashboardData.sessions_users?.total_users?.toLocaleString() || 0}
              color="from-green-500 to-emerald-500"
            />
            <StatCard
              icon={Clock}
              label="Sessions"
              value={dashboardData.sessions_users?.total_sessions?.toLocaleString() || 0}
              color="from-purple-500 to-pink-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Bounce Rate"
              value={`${dashboardData.bounce_rate?.bounce_rate?.toFixed(1) || 0}%`}
              color="from-orange-500 to-red-500"
            />
          </div>

          {/* Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-pink-500" />
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {dashboardData.traffic_sources?.traffic_sources?.slice(0, 6).map((source, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{source.channel}</span>
                        <span className="text-gray-500">{source.percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Top Countries
              </h3>
              <div className="space-y-3">
                {dashboardData.geographic?.countries?.slice(0, 6).map((country, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{country.country}</span>
                    <div className="text-right">
                      <span className="font-semibold">{country.active_users.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-2">users</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Top Pages
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Page</th>
                    <th className="text-right py-3 px-4 font-semibold">Views</th>
                    <th className="text-right py-3 px-4 font-semibold">Bounce Rate</th>
                    <th className="text-right py-3 px-4 font-semibold">Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.top_pages?.top_pages?.map((page, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-3 px-4">
                        <p className="font-medium truncate max-w-xs">{page.title || page.path}</p>
                        <p className="text-xs text-gray-400">{page.path}</p>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">{page.views.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{page.bounce_rate}%</td>
                      <td className="text-right py-3 px-4">{page.avg_duration}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Error Message */}
      {dashboardData?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-red-700 mb-2">Error Loading Analytics</h3>
          <p className="text-red-600">{dashboardData.error}</p>
        </div>
      )}

      {/* Setup Instructions */}
      {!credStatus?.configured && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Go to <strong>Google Cloud Console</strong> → Create a project (or select existing)</li>
            <li>Enable <strong>Google Analytics Data API</strong></li>
            <li>Go to <strong>IAM & Admin</strong> → <strong>Service Accounts</strong> → Create service account</li>
            <li>Create a <strong>JSON key</strong> for the service account</li>
            <li>Go to <strong>Google Analytics</strong> → Admin → Property Access Management</li>
            <li>Add the service account email with <strong>Viewer</strong> role</li>
            <li>Copy your <strong>Property ID</strong> from GA4 settings</li>
            <li>Upload the JSON key file above</li>
          </ol>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default AdminGoogleAnalytics;
