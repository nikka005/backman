import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Users, Search, Eye, Pause, Play, Loader2 } from 'lucide-react';

const AdminUsersManagement = () => {
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
    <div data-testid="admin-users-management">
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
              data-testid="user-search-input"
            />
          </div>
          <Button onClick={loadUsers} data-testid="search-users-btn">
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
                <tr key={user.id} className="border-t border-gray-100" data-testid={`user-row-${user.id}`}>
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
                      <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)} data-testid={`view-user-${user.id}`}>
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

export default AdminUsersManagement;
