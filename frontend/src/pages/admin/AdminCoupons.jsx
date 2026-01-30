import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Tag, Plus, Trash2, Edit2, Loader2, CheckCircle, 
  XCircle, Percent, Calendar, Users
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_percent: 10,
    discount_amount: 0,
    max_uses: '',
    valid_plans: '',
    expires_at: ''
  });
  
  useEffect(() => {
    loadCoupons();
  }, []);
  
  const loadCoupons = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/payments/admin/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_percent: parseInt(formData.discount_percent) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_plans: formData.valid_plans ? formData.valid_plans.split(',').map(p => p.trim()) : null,
        expires_at: formData.expires_at || null
      };
      
      const url = editing 
        ? `${API_URL}/api/payments/admin/coupons/${editing}` 
        : `${API_URL}/api/payments/admin/coupons`;
      const method = editing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast.success(editing ? 'Coupon updated!' : 'Coupon created!');
        setShowForm(false);
        setEditing(null);
        resetForm();
        loadCoupons();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save coupon');
      }
    } catch (error) {
      toast.error('Error saving coupon');
    } finally {
      setSaving(false);
    }
  };
  
  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_percent: coupon.discount_percent || 0,
      discount_amount: coupon.discount_amount || 0,
      max_uses: coupon.max_uses || '',
      valid_plans: coupon.valid_plans ? coupon.valid_plans.join(', ') : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : ''
    });
    setEditing(coupon.id);
    setShowForm(true);
  };
  
  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/payments/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Coupon deleted');
        loadCoupons();
      }
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };
  
  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_percent: 10,
      discount_amount: 0,
      max_uses: '',
      valid_plans: '',
      expires_at: ''
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-500">Create and manage discount codes</p>
        </div>
        <Button 
          onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}
          className="bg-gradient-to-r from-pink-500 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Coupons</p>
          <p className="text-2xl font-bold">{coupons.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {coupons.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Uses</p>
          <p className="text-2xl font-bold">
            {coupons.reduce((sum, c) => sum + (c.current_uses || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Avg Discount</p>
          <p className="text-2xl font-bold">
            {coupons.length > 0 ? Math.round(coupons.reduce((sum, c) => sum + (c.discount_percent || 0), 0) / coupons.length) : 0}%
          </p>
        </div>
      </div>
      
      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., WELCOME20"
                  className="uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="20% off first purchase"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount %</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses (leave empty for unlimited)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <Input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Valid Plans (comma separated, leave empty for all)</label>
              <Input
                value={formData.valid_plans}
                onChange={(e) => setFormData({...formData, valid_plans: e.target.value})}
                placeholder="basic, pro, enterprise"
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="bg-pink-500 hover:bg-pink-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editing ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Coupons Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Discount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Valid Plans</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Expires</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-pink-500" />
                    <span className="font-mono font-semibold">{coupon.code}</span>
                  </div>
                  {coupon.description && (
                    <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-green-100 text-green-700">
                    <Percent className="w-3 h-3 mr-1" />
                    {coupon.discount_percent}% OFF
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    {coupon.current_uses || 0} / {coupon.max_uses || '∞'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {coupon.valid_plans ? (
                    <div className="flex flex-wrap gap-1">
                      {coupon.valid_plans.map((plan, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{plan}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">All plans</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {coupon.expires_at ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(coupon.expires_at).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Never</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {coupon.is_active ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No coupons created yet. Click "Create Coupon" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Default Test Coupons Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Default Test Coupons (Always Active)</h3>
        <p className="text-sm text-blue-700 mb-2">These coupons are hardcoded for testing and always work:</p>
        <div className="flex gap-4">
          <Badge className="bg-blue-100 text-blue-700">WELCOME20 - 20% off</Badge>
          <Badge className="bg-blue-100 text-blue-700">ADVERLYX10 - 10% off</Badge>
          <Badge className="bg-blue-100 text-blue-700">FIRST50 - 50% off</Badge>
          <Badge className="bg-blue-100 text-blue-700">GROWTH25 - 25% off</Badge>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;
