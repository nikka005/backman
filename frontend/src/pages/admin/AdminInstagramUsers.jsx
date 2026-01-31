import React, { useState, useEffect } from 'react';
import { 
  Instagram, Users, TrendingUp, RefreshCw, Eye, Search,
  CheckCircle, AlertCircle, Pause, Play, ExternalLink,
  BarChart3, Target, Calendar, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';

const AdminInstagramUsers = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/analytics/instagram-users');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching Instagram users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/admin/analytics/instagram-users/${userId}`);
      setUserDetail(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching user detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredUsers = data?.users?.filter(user =>
    user.instagram_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Instagram className="w-7 h-7 text-pink-500" />
            Instagram Users
          </h1>
          <p className="text-gray-500 mt-1">Real Instagram data from connected accounts</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.total_instagram_accounts || 0}</p>
              <p className="text-xs text-gray-500">Total Accounts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.oauth_connected || 0}</p>
              <p className="text-xs text-gray-500">OAuth Connected</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(data?.summary?.total_followers_across_all || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Followers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(data?.summary?.total_followers_delivered || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Followers Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by username, email, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instagram</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gained</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.user_name}</p>
                      <p className="text-xs text-gray-500">{user.user_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.profile_picture_url ? (
                        <img 
                          src={user.profile_picture_url} 
                          alt={user.instagram_username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.instagram_username?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">@{user.instagram_username}</p>
                        <p className="text-xs text-gray-500">{user.niche || 'No niche'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{user.followers_count?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{user.posts_count} posts</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowUp className="w-3 h-3" />
                      <span className="font-medium">+{user.total_followers_gained?.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500">+{user.followers_today || 0} today</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{user.engagement_rate?.toFixed(2)}%</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {user.oauth_connected ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Live Data</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">Demo Mode</Badge>
                      )}
                      {user.growth_paused ? (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">Paused</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchUserDetail(user.user_id)}
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Instagram className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No Instagram accounts found</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && userDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : (
                <>
                  {/* Profile Header */}
                  <div className="flex items-center gap-4">
                    {userDetail.instagram_account?.profile_picture_url ? (
                      <img 
                        src={userDetail.instagram_account.profile_picture_url}
                        alt={userDetail.instagram_account.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Instagram className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        @{userDetail.instagram_account?.username}
                      </h3>
                      <p className="text-gray-500">{userDetail.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {userDetail.instagram_account?.oauth_connected ? (
                          <Badge className="bg-green-100 text-green-700">Live Data</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">Demo Mode</Badge>
                        )}
                        <Badge className="bg-pink-100 text-pink-700">
                          {userDetail.subscription?.plan || 'Free'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {userDetail.instagram_account?.followers_count?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {userDetail.instagram_account?.following_count?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {userDetail.instagram_account?.posts_count}
                      </p>
                      <p className="text-xs text-gray-500">Posts</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {userDetail.instagram_account?.engagement_rate?.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
                  </div>

                  {/* Growth Metrics */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-pink-500" />
                      Growth Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          +{userDetail.instagram_account?.total_followers_gained?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total Gained</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          +{userDetail.instagram_account?.followers_today || 0}
                        </p>
                        <p className="text-xs text-gray-500">Today</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          +{userDetail.instagram_account?.followers_this_week || 0}
                        </p>
                        <p className="text-xs text-gray-500">This Week</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          +{userDetail.instagram_account?.followers_this_month || 0}
                        </p>
                        <p className="text-xs text-gray-500">This Month</p>
                      </div>
                    </div>
                  </div>

                  {/* Targeting Info */}
                  {userDetail.targeting && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-pink-500" />
                        Targeting Settings
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Niche:</strong> {userDetail.targeting.niche || 'Not set'}</p>
                        <p><strong>Hashtags:</strong> {userDetail.targeting.hashtags?.join(', ') || 'None'}</p>
                        <p><strong>Competitors:</strong> {userDetail.targeting.competitor_accounts?.join(', ') || 'None'}</p>
                        <p><strong>Locations:</strong> {userDetail.targeting.locations?.join(', ') || 'None'}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {userDetail.ai_analysis && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        AI Analysis
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Detected Niche:</strong> {userDetail.ai_analysis.detected_niche || 'N/A'}</p>
                        <p><strong>Suggested Plan:</strong> {userDetail.ai_analysis.suggested_plan || 'N/A'}</p>
                        <p><strong>Growth Summary:</strong> {userDetail.ai_analysis.growth_summary || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Growth Logs */}
                  {userDetail.growth_logs?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userDetail.growth_logs.slice(0, 5).map((log, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600">{log.message}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInstagramUsers;
