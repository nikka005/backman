import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Plus, Edit2, Trash2, Save, RefreshCw, Loader2, Check, X,
  Zap, Target, HeadphonesIcon, BarChart3, Sparkles, GripVertical
} from 'lucide-react';

const AdminFeatureMatrix = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState([]);
  const [editingFeature, setEditingFeature] = useState(null);
  const [message, setMessage] = useState(null);

  const categories = [
    { key: 'growth', label: 'Growth', icon: Zap, color: 'from-green-500 to-emerald-500' },
    { key: 'targeting', label: 'Targeting', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { key: 'support', label: 'Support', icon: HeadphonesIcon, color: 'from-orange-500 to-amber-500' },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-purple-500 to-pink-500' },
    { key: 'advanced', label: 'Advanced', icon: Sparkles, color: 'from-pink-500 to-rose-500' },
  ];

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFeatureMatrix();
      setFeatures(response.data);
    } catch (error) {
      console.error('Error loading features:', error);
      setMessage({ type: 'error', text: 'Failed to load feature matrix' });
    } finally {
      setLoading(false);
    }
  };

  const saveFeature = async (feature) => {
    try {
      setSaving(true);
      await adminAPI.updateFeatureMatrixItem(feature.feature_key, feature);
      await loadFeatures();
      setEditingFeature(null);
      setMessage({ type: 'success', text: 'Feature updated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving feature:', error);
      setMessage({ type: 'error', text: 'Failed to save feature' });
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    try {
      await adminAPI.seedFeatureMatrix();
      await loadFeatures();
      setMessage({ type: 'success', text: 'Default features loaded!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error seeding defaults:', error);
    }
  };

  const getFeaturesByCategory = (categoryKey) => {
    return features.filter(f => f.category === categoryKey);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-feature-matrix-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Matrix</h1>
          <p className="text-gray-500">Manage plan feature comparisons</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={seedDefaults} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Load Defaults
          </Button>
          <Button onClick={() => setEditingFeature({ 
            feature_key: '', 
            feature_name: '', 
            category: 'growth',
            is_boolean: true,
            basic_value: 'No',
            pro_value: 'No',
            enterprise_value: 'No'
          })} data-testid="add-feature-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Feature
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

      {/* Feature Matrix Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-4 px-6 font-semibold text-gray-900 w-1/3">Feature</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 w-1/6">Basic</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 w-1/6 bg-pink-50">Pro</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 w-1/6">Enterprise</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const categoryFeatures = getFeaturesByCategory(category.key);
                const Icon = category.icon;
                
                if (categoryFeatures.length === 0) return null;
                
                return (
                  <React.Fragment key={category.key}>
                    {/* Category Header */}
                    <tr className="bg-gray-100">
                      <td colSpan={5} className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-semibold text-gray-700">{category.label}</span>
                          <Badge variant="secondary" className="ml-2">{categoryFeatures.length}</Badge>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Features in Category */}
                    {categoryFeatures.map((feature) => (
                      <tr key={feature.feature_key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{feature.feature_name}</p>
                            <p className="text-xs text-gray-500">{feature.feature_key}</p>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <FeatureValue value={feature.basic_value} isBoolean={feature.is_boolean} />
                        </td>
                        <td className="py-3 px-6 text-center bg-pink-50/30">
                          <FeatureValue value={feature.pro_value} isBoolean={feature.is_boolean} />
                        </td>
                        <td className="py-3 px-6 text-center">
                          <FeatureValue value={feature.enterprise_value} isBoolean={feature.is_boolean} />
                        </td>
                        <td className="py-3 px-6 text-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingFeature(feature)}
                            data-testid={`edit-feature-${feature.feature_key}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingFeature && (
        <FeatureEditModal 
          feature={editingFeature}
          categories={categories}
          onClose={() => setEditingFeature(null)}
          onSave={saveFeature}
          saving={saving}
        />
      )}
    </div>
  );
};

// Feature Value Display Component
const FeatureValue = ({ value, isBoolean }) => {
  if (isBoolean) {
    if (value === 'Yes' || value === true) {
      return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    } else {
      return <span className="text-gray-300">—</span>;
    }
  }
  return <span className="font-medium text-gray-900">{value}</span>;
};

// Feature Edit Modal Component
const FeatureEditModal = ({ feature, categories, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({ ...feature });

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {feature.feature_key ? 'Edit Feature' : 'Add New Feature'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Feature Key</Label>
              <Input 
                value={formData.feature_key}
                onChange={(e) => handleChange('feature_key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g., ai_targeting"
                className="mt-1"
                required
                disabled={!!feature.feature_key}
                data-testid="feature-key-input"
              />
            </div>
            <div>
              <Label>Category</Label>
              <select 
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg"
                data-testid="feature-category-select"
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Feature Name</Label>
            <Input 
              value={formData.feature_name}
              onChange={(e) => handleChange('feature_name', e.target.value)}
              placeholder="e.g., AI-Powered Targeting"
              className="mt-1"
              required
              data-testid="feature-name-input"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label>Boolean (Yes/No) Values</Label>
            <Switch 
              checked={formData.is_boolean}
              onCheckedChange={(v) => handleChange('is_boolean', v)}
              data-testid="feature-is-boolean"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Basic</Label>
              {formData.is_boolean ? (
                <select 
                  value={formData.basic_value}
                  onChange={(e) => handleChange('basic_value', e.target.value)}
                  className="mt-1 w-full p-2 border rounded-lg"
                  data-testid="feature-basic-value"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <Input 
                  value={formData.basic_value || ''}
                  onChange={(e) => handleChange('basic_value', e.target.value)}
                  placeholder="e.g., 5"
                  className="mt-1"
                  data-testid="feature-basic-value"
                />
              )}
            </div>
            <div>
              <Label>Pro</Label>
              {formData.is_boolean ? (
                <select 
                  value={formData.pro_value}
                  onChange={(e) => handleChange('pro_value', e.target.value)}
                  className="mt-1 w-full p-2 border rounded-lg"
                  data-testid="feature-pro-value"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <Input 
                  value={formData.pro_value || ''}
                  onChange={(e) => handleChange('pro_value', e.target.value)}
                  placeholder="e.g., 15"
                  className="mt-1"
                  data-testid="feature-pro-value"
                />
              )}
            </div>
            <div>
              <Label>Enterprise</Label>
              {formData.is_boolean ? (
                <select 
                  value={formData.enterprise_value}
                  onChange={(e) => handleChange('enterprise_value', e.target.value)}
                  className="mt-1 w-full p-2 border rounded-lg"
                  data-testid="feature-enterprise-value"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <Input 
                  value={formData.enterprise_value || ''}
                  onChange={(e) => handleChange('enterprise_value', e.target.value)}
                  placeholder="e.g., Unlimited"
                  className="mt-1"
                  data-testid="feature-enterprise-value"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-feature-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Feature
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFeatureMatrix;
