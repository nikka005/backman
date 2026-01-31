import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Mail, Send, Calendar, TrendingUp, Users, 
  Loader2, RefreshCw, CheckCircle, AlertCircle, Eye, Clock
} from 'lucide-react';

const AdminWeeklyReports = () => {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [message, setMessage] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, historyRes] = await Promise.all([
        adminAPI.getUsers({ limit: 100 }),
        adminAPI.get('/weekly-reports/history')
      ]);
      setUsers(usersRes.data || []);
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Only set users if the history fails
      try {
        const usersRes = await adminAPI.getUsers({ limit: 100 });
        setUsers(usersRes.data || []);
      } catch (e) {
        console.error('Error loading users:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendReport = async (userId = null) => {
    try {
      if (userId) {
        setSending(true);
      } else {
        setSendingAll(true);
      }
      setMessage(null);
      
      const response = await adminAPI.post('/weekly-reports/send', { user_id: userId });
      
      setMessage({
        type: 'success',
        text: response.data.message
      });
      
      loadData();
    } catch (error) {
      console.error('Error sending report:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to send reports'
      });
    } finally {
      setSending(false);
      setSendingAll(false);
    }
  };

  const previewReport = async (userId) => {
    try {
      setLoadingPreview(true);
      const response = await adminAPI.get(`/weekly-reports/preview/${userId}`);
      setPreviewData(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error loading preview:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to load preview'
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Filter users with Instagram accounts
  const eligibleUsers = users.filter(u => u.instagram_username);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-weekly-reports">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Growth Reports</h1>
          <p className="text-gray-500">Send AI-powered weekly growth reports to users</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => sendReport(null)}
            disabled={sendingAll || eligibleUsers.length === 0}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2"
            data-testid="send-all-reports-btn"
          >
            {sendingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send to All ({eligibleUsers.length})
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold">Eligible Users ({eligibleUsers.length})</h2>
              <p className="text-sm text-gray-500">Users with connected Instagram accounts</p>
            </div>
            
            {eligibleUsers.length > 0 ? (
              <div className="divide-y">
                {eligibleUsers.map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50" data-testid={`user-row-${user.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {(user.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">@{user.instagram_username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => previewReport(user.id)}
                        disabled={loadingPreview && selectedUser === user.id}
                        data-testid={`preview-btn-${user.id}`}
                      >
                        {loadingPreview && selectedUser === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => sendReport(user.id)}
                        disabled={sending}
                        className="bg-gradient-to-r from-pink-500 to-purple-500"
                        data-testid={`send-btn-${user.id}`}
                      >
                        {sending && selectedUser === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users with connected Instagram accounts</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - History & Preview */}
        <div className="space-y-6">
          {/* Preview Panel */}
          {previewData && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                <h3 className="font-semibold">Report Preview</h3>
                <p className="text-sm text-white/80">@{previewData.data?.username}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600">Followers Gained</p>
                    <p className="text-xl font-bold text-green-700">
                      {previewData.data?.followers_gained >= 0 ? '+' : ''}{previewData.data?.followers_gained}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600">Total</p>
                    <p className="text-xl font-bold text-blue-700">{previewData.data?.followers_total?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 mb-1">AI Insights</p>
                  <p className="text-sm text-purple-800">{previewData.data?.ai_insights}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-2">Recommendations</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {previewData.data?.recommendations?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-pink-500">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                  onClick={() => sendReport(selectedUser)}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send This Report
                </Button>
              </div>
            </div>
          )}

          {/* Recent History */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Reports
              </h3>
            </div>
            {history.length > 0 ? (
              <div className="divide-y max-h-80 overflow-y-auto">
                {history.slice(0, 10).map((report, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">@{report.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.sent_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Sent</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No reports sent yet
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-2">About Weekly Reports</h3>
            <ul className="text-sm text-purple-700 space-y-2">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                AI-generated growth insights
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Weekly performance metrics
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Personalized recommendations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWeeklyReports;
