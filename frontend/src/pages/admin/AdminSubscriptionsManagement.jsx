import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CreditCard, RefreshCw, Loader2 } from 'lucide-react';

const AdminSubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changePlanModal, setChangePlanModal] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    loadPlans();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSubscriptions();
      setSubscriptions(response.data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
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

  const handleCancel = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await adminAPI.cancelSubscription(subscriptionId);
      loadSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const handleChangePlan = async () => {
    if (!changePlanModal || !selectedPlan) return;
    setChangingPlan(true);
    try {
      await adminAPI.changePlan(changePlanModal.id, selectedPlan);
      setChangePlanModal(null);
      setSelectedPlan('');
      loadSubscriptions();
      alert('Plan changed successfully!');
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan');
    } finally {
      setChangingPlan(false);
    }
  };

  return (
    <div data-testid="admin-subscriptions-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500">Manage user subscriptions and plans</p>
        </div>
        <Button onClick={loadSubscriptions} variant="outline" className="gap-2" data-testid="refresh-subscriptions-btn">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Plan</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Billing</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Started</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-gray-100" data-testid={`subscription-row-${sub.id}`}>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{sub.user_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{sub.user_email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className="bg-purple-100 text-purple-700 capitalize">{sub.plan}</Badge>
                  </td>
                  <td className="py-4 px-6 capitalize">{sub.billing_cycle}</td>
                  <td className="py-4 px-6 font-medium">${sub.amount?.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <Badge className={sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {sub.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { setChangePlanModal(sub); setSelectedPlan(sub.plan); }}>
                            Change Plan
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancel(sub.id)}>
                            Cancel
                          </Button>
                        </>
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
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No subscriptions found</p>
        </div>
      )}

      {/* Change Plan Modal */}
      {changePlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setChangePlanModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Change Plan</h2>
              <Button variant="ghost" size="sm" onClick={() => setChangePlanModal(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">User</p>
                <p className="font-medium">{changePlanModal.user_name || changePlanModal.user_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                <Badge className="bg-purple-100 text-purple-700 capitalize">{changePlanModal.plan}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  data-testid="plan-select"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.name?.toLowerCase()}>
                      {plan.name} - ${plan.monthly_price}/mo
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setChangePlanModal(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500" 
                  onClick={handleChangePlan}
                  disabled={changingPlan || selectedPlan === changePlanModal.plan}
                  data-testid="change-plan-submit"
                >
                  {changingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Change Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsManagement;
