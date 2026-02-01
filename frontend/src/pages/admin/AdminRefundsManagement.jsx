import React, { useState, useEffect } from 'react';
import { refundsAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  RefreshCw, Loader2, DollarSign, Clock, CheckCircle, XCircle,
  AlertCircle, Search, Eye, ChevronRight, Filter
} from 'lucide-react';

const AdminRefundsManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRefunds();
    loadStats();
  }, [statusFilter]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await refundsAPI.getRefunds(statusFilter || undefined);
      setRefunds(response.data.refunds || []);
    } catch (error) {
      console.error('Error loading refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await refundsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprove = async (approved) => {
    if (!selectedRefund) return;
    setProcessing(true);
    try {
      await refundsAPI.approveRefund(selectedRefund.id, { approved, admin_notes: adminNotes });
      setSelectedRefund(null);
      setAdminNotes('');
      loadRefunds();
      loadStats();
    } catch (error) {
      console.error('Error approving refund:', error);
      alert('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async (refundId) => {
    setProcessing(true);
    try {
      await refundsAPI.processRefund(refundId);
      loadRefunds();
      loadStats();
      alert('Refund processed successfully!');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRefunds = refunds.filter(r => 
    !searchTerm || 
    r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      processed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  return (
    <div data-testid="admin-refunds-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-500">Review and process refund requests</p>
        </div>
        <Button onClick={loadRefunds} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pending_refunds}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Processed</p>
                <p className="text-2xl font-bold">{stats.all_time?.processed_count || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Refunded</p>
                <p className="text-2xl font-bold">${stats.all_time?.total_amount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Refund Rate</p>
                <p className="text-2xl font-bold">{stats.refund_rate || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
        </select>
      </div>

      {/* Refunds List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : filteredRefunds.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Type</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(refund.requested_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium">{refund.user_email || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{refund.id.slice(0, 16)}...</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium">${refund.amount?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">of ${refund.original_amount?.toFixed(2)}</p>
                  </td>
                  <td className="py-4 px-6 capitalize">{refund.refund_type}</td>
                  <td className="py-4 px-6">{getStatusBadge(refund.status)}</td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRefund(refund)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {refund.status === 'approved' && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleProcess(refund.id)}
                          disabled={processing}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No refund requests found</p>
        </div>
      )}

      {/* Refund Detail Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRefund(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Refund Request Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRefund(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-medium text-sm">{selectedRefund.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedRefund.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedRefund.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Provider</p>
                  <p className="font-medium capitalize">{selectedRefund.payment_provider}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Original Amount</span>
                  <span className="font-medium">${selectedRefund.original_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Refund Amount</span>
                  <span className="font-bold text-lg text-pink-600">${selectedRefund.amount?.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <p className="bg-gray-50 rounded-lg p-3">{selectedRefund.reason}</p>
              </div>

              {selectedRefund.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Notes</label>
                    <Input
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes (optional)..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleApprove(false)}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprove(true)}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve
                    </Button>
                  </div>
                </>
              )}

              {selectedRefund.admin_notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
                  <p className="bg-yellow-50 rounded-lg p-3 text-yellow-800">{selectedRefund.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefundsManagement;
