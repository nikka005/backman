import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Plus, Edit2, Trash2, Star, Copy, GripVertical,
  Save, RefreshCw, Loader2, Check, X, DollarSign,
  Users, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const AdminPlans = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPlans(true);
      setPlans(response.data);
    } catch (error) {
      console.error('Error loading plans:', error);
      setMessage({ type: 'error', text: 'Failed to load plans' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePopular = async (planId) => {
    try {
      await adminAPI.togglePlanPopular(planId);
      loadPlans();
      setMessage({ type: 'success', text: 'Popular plan updated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error toggling popular:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await adminAPI.deletePlan(planId);
      loadPlans();
      setMessage({ type: 'success', text: 'Plan deleted!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting plan:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete' });
    }
  };

  const handleClonePlan = async (plan) => {
    const newName = prompt('Enter name for cloned plan:', `${plan.name} Copy`);
    if (!newName) return;
    const newSlug = newName.toLowerCase().replace(/\s+/g, '-');
    try {
      await adminAPI.clonePlan(plan.id, newName, newSlug);
      loadPlans();
      setMessage({ type: 'success', text: 'Plan cloned!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error cloning plan:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to clone' });
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
    <div data-testid="admin-plans-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500">Manage pricing plans and features</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadPlans} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} data-testid="create-plan-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            onEdit={() => setEditingPlan(plan)}
            onDelete={() => handleDeletePlan(plan.id)}
            onClone={() => handleClonePlan(plan)}
            onTogglePopular={() => handleTogglePopular(plan.id)}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <PlanModal 
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={async (data) => {
            try {
              await adminAPI.updatePlan(editingPlan.id, data);
              loadPlans();
              setEditingPlan(null);
              setMessage({ type: 'success', text: 'Plan updated!' });
              setTimeout(() => setMessage(null), 3000);
            } catch (error) {
              setMessage({ type: 'error', text: 'Failed to update plan' });
            }
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <PlanModal 
          plan={null}
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            try {
              await adminAPI.createPlan(data);
              loadPlans();
              setShowCreateModal(false);
              setMessage({ type: 'success', text: 'Plan created!' });
              setTimeout(() => setMessage(null), 3000);
            } catch (error) {
              setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to create plan' });
            }
          }}
        />
      )}
    </div>
  );
};

// Plan Card Component
const PlanCard = ({ plan, onEdit, onDelete, onClone, onTogglePopular }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${plan.is_popular ? 'ring-2 ring-pink-500' : ''} ${plan.is_hidden ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              {plan.is_popular && (
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  <Star className="w-3 h-3 mr-1" /> Popular
                </Badge>
              )}
              {plan.is_hidden && (
                <Badge variant="outline" className="text-gray-500">Hidden</Badge>
              )}
              {!plan.is_active && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{plan.slug}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="p-6 bg-gray-50">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">${plan.monthly_price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        <div className="text-sm text-gray-500">
          or ${plan.yearly_price}/mo billed yearly
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-pink-500" />
          <span>{plan.followers_min.toLocaleString()} - {plan.followers_max.toLocaleString()} followers/mo</span>
        </div>
      </div>

      {/* Features */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-700">Features</span>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <ul className={`space-y-2 ${expanded ? '' : 'max-h-32 overflow-hidden'}`}>
          {plan.feature_list?.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Limits */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>IG Accounts: {plan.max_instagram_accounts}</div>
          <div>Niches: {plan.max_target_niches === -1 ? '∞' : plan.max_target_niches}</div>
          <div>Speed: {plan.growth_speed}</div>
          <div>Support: {plan.support_priority}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} data-testid={`edit-plan-${plan.slug}`}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onClone} data-testid={`clone-plan-${plan.slug}`}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-red-500 hover:text-red-600" data-testid={`delete-plan-${plan.slug}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <Button 
          size="sm" 
          variant={plan.is_popular ? "default" : "outline"}
          onClick={onTogglePopular}
          className={plan.is_popular ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : ""}
          data-testid={`popular-plan-${plan.slug}`}
        >
          <Star className="w-4 h-4 mr-1" />
          {plan.is_popular ? 'Popular' : 'Set Popular'}
        </Button>
      </div>
    </div>
  );
};

// Plan Modal Component
const PlanModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    slug: plan?.slug || '',
    description: plan?.description || '',
    monthly_price: plan?.monthly_price || 0,
    yearly_price: plan?.yearly_price || 0,
    followers_min: plan?.followers_min || 1000,
    followers_max: plan?.followers_max || 2000,
    feature_list: plan?.feature_list || [],
    is_popular: plan?.is_popular || false,
    is_active: plan?.is_active ?? true,
    is_hidden: plan?.is_hidden || false,
    max_instagram_accounts: plan?.max_instagram_accounts || 1,
    max_target_niches: plan?.max_target_niches || 5,
    growth_speed: plan?.growth_speed || 'medium',
    support_priority: plan?.support_priority || 'standard',
    has_dedicated_manager: plan?.has_dedicated_manager || false,
    analytics_depth: plan?.analytics_depth || 'basic',
    trial_days: plan?.trial_days || 0,
  });
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      handleChange('feature_list', [...formData.feature_list, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    handleChange('feature_list', formData.feature_list.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{plan ? 'Edit Plan' : 'Create New Plan'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Plan Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1"
                required
                data-testid="plan-name-input"
              />
            </div>
            <div>
              <Label>Slug (URL-friendly)</Label>
              <Input 
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="mt-1"
                required
                data-testid="plan-slug-input"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea 
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 w-full p-3 border rounded-lg resize-none"
              rows={2}
              required
              data-testid="plan-description-input"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Monthly Price ($)</Label>
              <Input 
                type="number"
                value={formData.monthly_price}
                onChange={(e) => handleChange('monthly_price', parseFloat(e.target.value))}
                className="mt-1"
                min={0}
                step={0.01}
                data-testid="plan-monthly-price"
              />
            </div>
            <div>
              <Label>Yearly Price ($)</Label>
              <Input 
                type="number"
                value={formData.yearly_price}
                onChange={(e) => handleChange('yearly_price', parseFloat(e.target.value))}
                className="mt-1"
                min={0}
                step={0.01}
                data-testid="plan-yearly-price"
              />
            </div>
            <div>
              <Label>Min Followers</Label>
              <Input 
                type="number"
                value={formData.followers_min}
                onChange={(e) => handleChange('followers_min', parseInt(e.target.value))}
                className="mt-1"
                min={0}
                data-testid="plan-followers-min"
              />
            </div>
            <div>
              <Label>Max Followers</Label>
              <Input 
                type="number"
                value={formData.followers_max}
                onChange={(e) => handleChange('followers_max', parseInt(e.target.value))}
                className="mt-1"
                min={0}
                data-testid="plan-followers-max"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <Label>Features</Label>
            <div className="mt-2 space-y-2">
              {formData.feature_list.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-sm">{feature}</span>
                  <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input 
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add feature..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  data-testid="plan-new-feature"
                />
                <Button type="button" onClick={addFeature} variant="outline" data-testid="add-feature-btn">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>IG Accounts</Label>
              <Input 
                type="number"
                value={formData.max_instagram_accounts}
                onChange={(e) => handleChange('max_instagram_accounts', parseInt(e.target.value))}
                className="mt-1"
                min={1}
                data-testid="plan-max-accounts"
              />
            </div>
            <div>
              <Label>Max Niches (-1=∞)</Label>
              <Input 
                type="number"
                value={formData.max_target_niches}
                onChange={(e) => handleChange('max_target_niches', parseInt(e.target.value))}
                className="mt-1"
                min={-1}
                data-testid="plan-max-niches"
              />
            </div>
            <div>
              <Label>Growth Speed</Label>
              <select 
                value={formData.growth_speed}
                onChange={(e) => handleChange('growth_speed', e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg"
                data-testid="plan-growth-speed"
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>
            <div>
              <Label>Support Priority</Label>
              <select 
                value={formData.support_priority}
                onChange={(e) => handleChange('support_priority', e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg"
                data-testid="plan-support-priority"
              >
                <option value="standard">Standard</option>
                <option value="priority">Priority</option>
                <option value="dedicated">Dedicated</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label>Active</Label>
              <Switch checked={formData.is_active} onCheckedChange={(v) => handleChange('is_active', v)} data-testid="plan-is-active" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label>Hidden</Label>
              <Switch checked={formData.is_hidden} onCheckedChange={(v) => handleChange('is_hidden', v)} data-testid="plan-is-hidden" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label>Dedicated Manager</Label>
              <Switch checked={formData.has_dedicated_manager} onCheckedChange={(v) => handleChange('has_dedicated_manager', v)} data-testid="plan-has-manager" />
            </div>
          </div>

          {/* Trial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Trial Days</Label>
              <Input 
                type="number"
                value={formData.trial_days}
                onChange={(e) => handleChange('trial_days', parseInt(e.target.value))}
                className="mt-1"
                min={0}
                data-testid="plan-trial-days"
              />
            </div>
            <div>
              <Label>Analytics Depth</Label>
              <select 
                value={formData.analytics_depth}
                onChange={(e) => handleChange('analytics_depth', e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg"
                data-testid="plan-analytics-depth"
              >
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-plan-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPlans;
