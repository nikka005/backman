import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Users, Search, Eye, Pause, Play, Loader2, Edit2, Save, X, 
  Instagram, TrendingUp, Target, CheckCircle, RefreshCw, Mail,
  Calendar, CreditCard, Settings, UserCheck, UserX
} from 'lucide-react';

const AdminUsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ limit: 100, search: search || undefined });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
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

  const handleSuspend = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    try {
      await adminAPI.suspendUser(userId);
      showMessage('success', 'User suspended successfully');
      loadUsers();
      if (userDetails?.id === userId) {
        setUserDetails(prev => ({ ...prev, status: 'suspended' }));
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      showMessage('error', 'Failed to suspend user');
    }
  };

  const handleActivate = async (userId) => {
    try {
      await adminAPI.activateUser(userId);
      showMessage('success', 'User activated successfully');
      loadUsers();
      if (userDetails?.id === userId) {
        setUserDetails(prev => ({ ...prev, status: 'active' }));
      }
    } catch (error) {
      console.error('Error activating user:', error);
      showMessage('error', 'Failed to activate user');
    }
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setEditMode(false);
    try {
      const response = await adminAPI.getUser(user.id);
      const userData = response.data;
      setUserDetails(userData);
      setEditData({
        name: userData.name || '',
        email: userData.email || '',
        current_plan: userData.current_plan || '',
        instagram_username: userData.instagram_username || ''
      });
    } catch (error) {
      console.error('Error loading user details:', error);
      setUserDetails(user);
      setEditData({
        name: user.name || '',
        email: user.email || '',
        current_plan: user.current_plan || '',
        instagram_username: user.instagram_username || ''
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userDetails) return;
    setSaving(true);
    try {
      await adminAPI.updateUser(userDetails.id, editData);
      showMessage('success', 'User updated successfully');
      setEditMode(false);
      // Reload user details
      const response = await adminAPI.getUser(userDetails.id);
      setUserDetails(response.data);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showMessage('error', error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePlan = async (newPlan) => {
    if (!userDetails) return;
    if (!window.confirm(`Change user's plan to ${newPlan}?`)) return;
    
    setSaving(true);
    try {
      await adminAPI.updateUser(userDetails.id, { current_plan: newPlan });
      showMessage('success', `Plan changed to ${newPlan}`);
      const response = await adminAPI.getUser(userDetails.id);
      setUserDetails(response.data);
      setEditData(prev => ({ ...prev, current_plan: newPlan }));
      loadUsers();
    } catch (error) {
      console.error('Error changing plan:', error);
      showMessage('error', 'Failed to change plan');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Calculate growth progress
  const calculateGrowthProgress = (user) => {
    if (!user?.subscription || !user?.instagram_stats) return null;
    
    const plan = plans.find(p => p.name?.toLowerCase() === user.current_plan?.toLowerCase());
    if (!plan) return null;

    const targetFollowers = plan.follower_target_max || plan.follower_target || 1500;
    const startFollowers = user.subscription?.start_followers || user.instagram_stats?.followers_count || 0;
    const currentFollowers = user.instagram_stats?.followers_count || startFollowers;
    const gained = currentFollowers - startFollowers;
    const progress = Math.min(100, (gained / targetFollowers) * 100);

    return {
      target: targetFollowers,
      start: startFollowers,
      current: currentFollowers,
      gained,
      progress: Math.round(progress),
      isComplete: progress >= 100
    };
  };

  return (
    <div data-testid="admin-users-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage users, plans, and growth progress</p>
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
              data-testid="user-search-input"
            />
          </div>
          <Button onClick={loadUsers} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

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
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Plan</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Instagram</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Growth Progress</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const growth = calculateGrowthProgress(user);
                return (
                  <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50" data-testid={`user-row-${user.id}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 
                        user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }>
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      {user.current_plan ? (
                        <Badge className="bg-purple-100 text-purple-700 capitalize">{user.current_plan}</Badge>
                      ) : (
                        <span className="text-gray-400">No plan</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {user.instagram_username ? (
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-500" />
                          <span className="text-gray-600">@{user.instagram_username}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not connected</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {growth ? (
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{growth.gained}/{growth.target}</span>
                            <span className={growth.isComplete ? 'text-green-600 font-medium' : 'text-gray-600'}>{growth.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${growth.isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
                              style={{ width: `${growth.progress}%` }}
                            />
                          </div>
                          {growth.isComplete && (
                            <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3" /> Complete
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)} data-testid={`view-user-${user.id}`}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        {user.status === 'suspended' ? (
                          <Button size="sm" variant="outline" onClick={() => handleActivate(user.id)} className="text-green-600">
                            <Play className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleSuspend(user.id)} className="text-red-600">
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setSelectedUser(null); setEditMode(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">User Details</h2>
              <div className="flex items-center gap-2">
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="gap-2">
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveUser} disabled={saving} className="bg-gradient-to-r from-pink-500 to-purple-500 gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setEditMode(false); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {loadingDetails ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : userDetails && (
              <div className="p-6 space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                    {(userDetails.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    {editMode ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Name"
                          className="font-semibold text-lg"
                        />
                        <Input
                          value={editData.email}
                          onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Email"
                          type="email"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl font-semibold">{userDetails.name}</h3>
                        <p className="text-gray-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {userDetails.email}
                        </p>
                      </>
                    )}
                  </div>
                  <Badge className={
                    userDetails.status === 'active' ? 'bg-green-100 text-green-700 text-lg px-4 py-1' : 'bg-red-100 text-red-700 text-lg px-4 py-1'
                  }>
                    {userDetails.status === 'active' ? <UserCheck className="w-4 h-4 mr-1" /> : <UserX className="w-4 h-4 mr-1" />}
                    {userDetails.status || 'active'}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Current Plan</p>
                    {editMode ? (
                      <select
                        value={editData.current_plan || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, current_plan: e.target.value }))}
                        className="w-full mt-2 p-2 border rounded-lg"
                      >
                        <option value="">No Plan</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.name?.toLowerCase()}>{plan.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium mt-1 capitalize">{userDetails.current_plan || 'None'}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</p>
                    {editMode ? (
                      <Input
                        value={editData.instagram_username || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, instagram_username: e.target.value }))}
                        placeholder="@username"
                        className="mt-2"
                      />
                    ) : (
                      <p className="font-medium mt-1">{userDetails.instagram_username ? `@${userDetails.instagram_username}` : 'Not connected'}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined</p>
                    <p className="font-medium mt-1">{userDetails.created_at ? new Date(userDetails.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {/* Instagram Stats */}
                {userDetails.instagram_stats && (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                      <Instagram className="w-5 h-5" /> Instagram Stats
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{userDetails.instagram_stats.followers_count?.toLocaleString() || 0}</p>
                        <p className="text-sm text-gray-500">Followers</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-pink-600">{userDetails.instagram_stats.following_count?.toLocaleString() || 0}</p>
                        <p className="text-sm text-gray-500">Following</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">{userDetails.instagram_stats.media_count?.toLocaleString() || 0}</p>
                        <p className="text-sm text-gray-500">Posts</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Growth Progress */}
                {userDetails.current_plan && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> Growth Progress
                    </h4>
                    {(() => {
                      const growth = calculateGrowthProgress(userDetails);
                      if (!growth) return <p className="text-gray-500">No growth data available</p>;
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Target: <span className="font-medium">{growth.target} followers</span></p>
                              <p className="text-sm text-gray-600">Gained: <span className="font-medium text-green-600">+{growth.gained}</span></p>
                            </div>
                            <div className="text-right">
                              <p className={`text-3xl font-bold ${growth.isComplete ? 'text-green-600' : 'text-purple-600'}`}>{growth.progress}%</p>
                              {growth.isComplete && <Badge className="bg-green-100 text-green-700">Complete!</Badge>}
                            </div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${growth.isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
                              style={{ width: `${growth.progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Subscription Details */}
                {userDetails.subscription && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> Subscription Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Plan:</span> <span className="font-medium capitalize">{userDetails.subscription.plan}</span></div>
                      <div><span className="text-gray-500">Billing:</span> <span className="font-medium capitalize">{userDetails.subscription.billing_cycle}</span></div>
                      <div><span className="text-gray-500">Status:</span> <Badge className={userDetails.subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>{userDetails.subscription.status}</Badge></div>
                      <div><span className="text-gray-500">Amount:</span> <span className="font-medium">${userDetails.subscription.amount}</span></div>
                    </div>
                  </div>
                )}

                {/* Quick Plan Change */}
                {!editMode && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Quick Actions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {plans.map(plan => (
                        <Button
                          key={plan.id}
                          size="sm"
                          variant={userDetails.current_plan?.toLowerCase() === plan.name?.toLowerCase() ? 'default' : 'outline'}
                          onClick={() => handleChangePlan(plan.name?.toLowerCase())}
                          disabled={saving || userDetails.current_plan?.toLowerCase() === plan.name?.toLowerCase()}
                          className={userDetails.current_plan?.toLowerCase() === plan.name?.toLowerCase() ? 'bg-gradient-to-r from-pink-500 to-purple-500' : ''}
                        >
                          {plan.name}
                        </Button>
                      ))}
                      {userDetails.status === 'suspended' ? (
                        <Button size="sm" onClick={() => handleActivate(userDetails.id)} className="bg-green-600 hover:bg-green-700 gap-2">
                          <Play className="w-4 h-4" /> Activate
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => handleSuspend(userDetails.id)} className="gap-2">
                          <Pause className="w-4 h-4" /> Suspend
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagement;
