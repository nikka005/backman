import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { DollarSign, TrendingUp, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

const AdminPaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, pending: 0 });
  const [refundModal, setRefundModal] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPayments();
      const paymentList = response.data || [];
      setPayments(paymentList);
      
      // Calculate stats
      const now = new Date();
      const thisMonth = paymentList.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      });
      
      setStats({
        total: paymentList.reduce((sum, p) => sum + (p.amount || 0), 0),
        thisMonth: thisMonth.reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: paymentList.filter(p => p.status === 'pending').length
      });
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setProcessingRefund(true);
    try {
      const amount = parseFloat(refundAmount) || refundModal.amount;
      await adminAPI.processRefund(refundModal.id, { amount, reason: refundReason });
      setRefundModal(null);
      setRefundAmount('');
      setRefundReason('');
      loadPayments();
      alert('Refund processed successfully!');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div data-testid="admin-payments-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">View payment transactions</p>
        </div>
        <Button onClick={loadPayments} variant="outline" className="gap-2" data-testid="refresh-payments-btn">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : payments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Method</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-gray-100" data-testid={`payment-row-${payment.id}`}>
                  <td className="py-4 px-6 text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <p className="font-medium">{payment.user_name || payment.user_email || 'Unknown'}</p>
                  </td>
                  <td className="py-4 px-6 font-medium">${payment.amount?.toFixed(2)} {payment.currency?.toUpperCase()}</td>
                  <td className="py-4 px-6 capitalize">{payment.provider || payment.payment_method || 'Card'}</td>
                  <td className="py-4 px-6">
                    <Badge className={
                      payment.status === 'success' || payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      payment.status === 'refunded' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                    }>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {(payment.status === 'success' || payment.status === 'paid') && !payment.refunded && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-orange-600"
                        onClick={() => { setRefundModal(payment); setRefundAmount(payment.amount?.toString() || ''); }}
                        data-testid={`refund-btn-${payment.id}`}
                      >
                        Refund
                      </Button>
                    )}
                    {payment.status === 'refunded' && (
                      <span className="text-sm text-gray-400">Refunded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No payments yet</p>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRefundModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Process Refund</h2>
              <Button variant="ghost" size="sm" onClick={() => setRefundModal(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Original Payment</p>
                <p className="font-medium">{refundModal.user_name || refundModal.user_email}</p>
                <p className="text-lg font-bold text-green-600">${refundModal.amount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Refund Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  max={refundModal.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                  data-testid="refund-amount-input"
                />
                <p className="text-xs text-gray-500 mt-1">Max: ${refundModal.amount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refund..."
                  data-testid="refund-reason-input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setRefundModal(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-orange-500 hover:bg-orange-600" 
                  onClick={handleRefund}
                  disabled={processingRefund || !refundAmount || parseFloat(refundAmount) <= 0}
                  data-testid="process-refund-btn"
                >
                  {processingRefund ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Process Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsManagement;
