import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Settings, ChevronRight, ChevronLeft, Save, Loader2, 
  Eye, Globe, Lock, FileText, Layout, Zap, CreditCard, Shield,
  Check, X, Edit, ExternalLink, AlertTriangle, RefreshCw,
  Home, DollarSign, HelpCircle, Phone, BookOpen, Image,
  BarChart3, MessageSquare, Target, Play, Pause, Clock, History
} from 'lucide-react';

// ==================== MAIN FEATURE MANAGEMENT PAGE ====================

const FeatureManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { featureType, featureKey } = useParams();
  const [activeTab, setActiveTab] = useState(featureType || 'pages');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Feature data
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [platformFeatures, setPlatformFeatures] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [authOptions, setAuthOptions] = useState([]);
  const [changeLogs, setChangeLogs] = useState([]);
  
  // Selected feature for editing
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    initializeAndLoad();
  }, []);

  useEffect(() => {
    if (featureKey) {
      loadFeatureDetails(activeTab, featureKey);
    } else {
      setSelectedFeature(null);
      setEditMode(false);
    }
  }, [featureKey, activeTab]);

  const initializeAndLoad = async () => {
    try {
      setLoading(true);
      // Initialize default configurations
      await adminAPI.initializeFeatures();
      setInitialized(true);
      // Load all features
      await loadAllFeatures();
    } catch (error) {
      console.error('Error initializing:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFeatures = async () => {
    try {
      const [pagesRes, sectionsRes, platformRes, paymentsRes, authRes, logsRes] = await Promise.all([
        adminAPI.getFeaturePages(),
        adminAPI.getFeatureSections(),
        adminAPI.getPlatformFeatures(),
        adminAPI.getPaymentOptions(),
        adminAPI.getAuthOptions(),
        adminAPI.getFeatureLogs({ limit: 20 })
      ]);
      
      setPages(pagesRes.data || []);
      setSections(sectionsRes.data || []);
      setPlatformFeatures(platformRes.data || []);
      setPaymentOptions(paymentsRes.data || []);
      setAuthOptions(authRes.data || []);
      setChangeLogs(logsRes.data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const loadFeatureDetails = async (type, key) => {
    try {
      let response;
      switch (type) {
        case 'pages':
          response = await adminAPI.getFeaturePage(key);
          break;
        case 'sections':
          response = await adminAPI.getFeatureSection(key);
          break;
        case 'platform':
          response = await adminAPI.getPlatformFeature(key);
          break;
        case 'payments':
          response = await adminAPI.getPaymentOption(key);
          break;
        case 'auth':
          response = await adminAPI.getAuthOption(key);
          break;
        default:
          return;
      }
      setSelectedFeature(response.data);
      setEditMode(true);
    } catch (error) {
      console.error('Error loading feature details:', error);
    }
  };

  const handleManageFeature = (type, key) => {
    navigate(`/admin/features/${type}/${key}`);
  };

  const handleBackToList = () => {
    setSelectedFeature(null);
    setEditMode(false);
    navigate(`/admin/features/${activeTab}`);
  };

  const handleSaveFeature = async () => {
    if (!selectedFeature) return;
    
    setSaving(true);
    try {
      switch (activeTab) {
        case 'pages':
          await adminAPI.updateFeaturePage(selectedFeature.key, selectedFeature);
          break;
        case 'sections':
          await adminAPI.updateFeatureSection(selectedFeature.key, selectedFeature);
          break;
        case 'platform':
          await adminAPI.updatePlatformFeature(selectedFeature.key, selectedFeature);
          break;
        case 'payments':
          await adminAPI.updatePaymentOption(selectedFeature.key, selectedFeature);
          break;
        case 'auth':
          await adminAPI.updateAuthOption(selectedFeature.key, selectedFeature);
          break;
      }
      
      // Sync to site settings
      await adminAPI.syncFeaturesToSettings();
      
      // Reload
      await loadAllFeatures();
      
      alert('Feature saved successfully!');
    } catch (error) {
      console.error('Error saving feature:', error);
      alert('Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = async (type, key, enabled) => {
    try {
      await adminAPI.bulkToggleFeatures(type.replace('s', ''), [key], enabled);
      await adminAPI.syncFeaturesToSettings();
      await loadAllFeatures();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const handlePublish = async () => {
    if (!selectedFeature) return;
    
    try {
      switch (activeTab) {
        case 'pages':
          await adminAPI.publishPage(selectedFeature.key);
          break;
        case 'sections':
          await adminAPI.publishSection(selectedFeature.key);
          break;
      }
      await loadFeatureDetails(activeTab, selectedFeature.key);
      alert('Published successfully!');
    } catch (error) {
      console.error('Error publishing:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedFeature) return;
    
    try {
      await adminAPI.saveDraftPage(selectedFeature.key);
      await loadFeatureDetails(activeTab, selectedFeature.key);
      alert('Saved as draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const tabs = [
    { key: 'pages', label: 'Pages', icon: FileText, count: pages.length },
    { key: 'sections', label: 'Sections', icon: Layout, count: sections.length },
    { key: 'platform', label: 'Platform', icon: Zap, count: platformFeatures.length },
    { key: 'payments', label: 'Payments', icon: CreditCard, count: paymentOptions.length },
    { key: 'auth', label: 'Authentication', icon: Shield, count: authOptions.length },
  ];

  const getCurrentFeatures = () => {
    switch (activeTab) {
      case 'pages': return pages;
      case 'sections': return sections;
      case 'platform': return platformFeatures;
      case 'payments': return paymentOptions;
      case 'auth': return authOptions;
      default: return [];
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
    <div data-testid="feature-management-page">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/admin/settings')} className="hover:text-pink-600">
          Settings
        </button>
        <ChevronRight className="w-4 h-4" />
        <button onClick={() => handleBackToList()} className="hover:text-pink-600">
          Feature Management
        </button>
        {selectedFeature && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{selectedFeature.name}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Management</h1>
          <p className="text-gray-500">Configure and manage all platform features</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAllFeatures} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {editMode && (
            <>
              <Button variant="outline" onClick={handleBackToList} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleSaveFeature} disabled={saving} className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {!editMode ? (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <Badge className="bg-gray-100 text-gray-600">{tab.count}</Badge>
                </button>
              );
            })}
          </div>

          {/* Feature List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y">
              {getCurrentFeatures().map((feature) => (
                <FeatureRow
                  key={feature.key}
                  feature={feature}
                  type={activeTab}
                  onManage={() => handleManageFeature(activeTab, feature.key)}
                  onToggle={(enabled) => handleToggleFeature(activeTab, feature.key, enabled)}
                />
              ))}
              {getCurrentFeatures().length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No features configured. Click refresh to initialize.
                </div>
              )}
            </div>
          </div>

          {/* Recent Changes */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold">Recent Changes</h3>
            </div>
            <div className="space-y-2">
              {changeLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      log.action.includes('enable') ? 'bg-green-100 text-green-700' :
                      log.action.includes('disable') ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {log.action}
                    </Badge>
                    <span className="text-gray-600">{log.feature_name}</span>
                  </div>
                  <span className="text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
              {changeLogs.length === 0 && (
                <p className="text-gray-400 text-center py-4">No recent changes</p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Feature Editor */
        <FeatureEditor
          feature={selectedFeature}
          type={activeTab}
          onChange={setSelectedFeature}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </div>
  );
};

// ==================== FEATURE ROW COMPONENT ====================

const FeatureRow = ({ feature, type, onManage, onToggle }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">{status}</Badge>;
    }
  };

  const getIcon = () => {
    const icons = {
      page_home: Home, page_pricing: DollarSign, page_faq: HelpCircle,
      page_contact: Phone, page_blog: BookOpen, page_case_studies: BarChart3,
      page_how_it_works: FileText,
      section_hero: Image, section_testimonials: MessageSquare,
      section_stats: BarChart3, section_pricing: DollarSign,
      feature_instagram_connect: Image, feature_analytics: BarChart3,
      feature_targeting: Target, feature_support_tickets: MessageSquare,
      feature_stripe: CreditCard, feature_paypal: CreditCard,
      feature_google_login: Shield, feature_two_factor: Lock
    };
    const Icon = icons[feature.key] || Settings;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          feature.enabled ? 'bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600' : 'bg-gray-100 text-gray-400'
        }`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{feature.name}</span>
            {getStatusBadge(feature.status)}
          </div>
          <p className="text-sm text-gray-500">{feature.description || `Configure ${feature.name}`}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
        
        {/* Toggle */}
        <Switch
          checked={feature.enabled}
          onCheckedChange={onToggle}
          data-testid={`toggle-${feature.key}`}
        />
        
        {/* Manage button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onManage}
          className="gap-2"
          data-testid={`manage-${feature.key}`}
        >
          <Edit className="w-4 h-4" />
          Manage
        </Button>
      </div>
    </div>
  );
};

// ==================== FEATURE EDITOR COMPONENT ====================

const FeatureEditor = ({ feature, type, onChange, onPublish, onSaveDraft }) => {
  if (!feature) return null;

  const updateField = (field, value) => {
    onChange({ ...feature, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    onChange({
      ...feature,
      [parent]: { ...feature[parent], [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="font-medium">{feature.name}</span>
          <Badge className={
            feature.status === 'active' ? 'bg-green-100 text-green-700' :
            feature.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }>
            {feature.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          {(type === 'pages' || type === 'sections') && (
            <>
              <Button variant="outline" size="sm" onClick={onSaveDraft}>
                <Clock className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
              <Button size="sm" onClick={onPublish} className="bg-green-600 text-white">
                <Check className="w-4 h-4 mr-1" />
                Publish
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-1">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Basic Settings
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={feature.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={feature.enabled ? 'enabled' : 'disabled'}
              onChange={(e) => updateField('enabled', e.target.value === 'enabled')}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={feature.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Type-specific settings */}
      {type === 'pages' && <PageSettings feature={feature} onChange={onChange} updateField={updateField} updateNestedField={updateNestedField} />}
      {type === 'sections' && <SectionSettings feature={feature} onChange={onChange} updateField={updateField} updateNestedField={updateNestedField} />}
      {type === 'platform' && <PlatformFeatureSettings feature={feature} onChange={onChange} updateField={updateField} />}
      {type === 'payments' && <PaymentSettings feature={feature} onChange={onChange} updateField={updateField} />}
      {type === 'auth' && <AuthSettings feature={feature} onChange={onChange} updateField={updateField} updateNestedField={updateNestedField} />}
    </div>
  );
};

// ==================== PAGE SETTINGS ====================

const PageSettings = ({ feature, updateField, updateNestedField }) => (
  <>
    {/* URL & Navigation */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-gray-400" />
        URL & Navigation
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">URL Slug</label>
          <Input
            value={feature.url_slug || ''}
            onChange={(e) => updateField('url_slug', e.target.value)}
            placeholder="/page-name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Navigation Order</label>
          <Input
            type="number"
            value={feature.nav_order || 0}
            onChange={(e) => updateField('nav_order', parseInt(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={feature.show_header !== false}
              onChange={(e) => updateField('show_header', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Header</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={feature.show_footer !== false}
              onChange={(e) => updateField('show_footer', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Footer</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={feature.show_in_nav !== false}
              onChange={(e) => updateField('show_in_nav', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show in Nav</span>
          </label>
        </div>
      </div>
    </div>

    {/* SEO Settings */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gray-400" />
        SEO Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Page Title</label>
          <Input
            value={feature.seo?.title || ''}
            onChange={(e) => updateNestedField('seo', 'title', e.target.value)}
            placeholder="Page Title - Adverlyx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Meta Description</label>
          <textarea
            value={feature.seo?.meta_description || ''}
            onChange={(e) => updateNestedField('seo', 'meta_description', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
            placeholder="A brief description of this page..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">OG Image URL</label>
          <Input
            value={feature.seo?.og_image || ''}
            onChange={(e) => updateNestedField('seo', 'og_image', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>

    {/* Access Control */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-gray-400" />
        Access Control
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select
            value={feature.visibility || 'public'}
            onChange={(e) => updateField('visibility', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="public">Public</option>
            <option value="private">Private (Logged in only)</option>
            <option value="plan_restricted">Plan Restricted</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={feature.requires_auth || false}
            onChange={(e) => updateField('requires_auth', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Requires Authentication</span>
        </label>
      </div>
    </div>
  </>
);

// ==================== SECTION SETTINGS ====================

const SectionSettings = ({ feature, updateField, updateNestedField }) => (
  <>
    {/* Content */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gray-400" />
        Section Content
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Headline</label>
          <Input
            value={feature.content?.headline || ''}
            onChange={(e) => updateNestedField('content', 'headline', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subheadline</label>
          <Input
            value={feature.content?.subheadline || ''}
            onChange={(e) => updateNestedField('content', 'subheadline', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Body Text</label>
          <textarea
            value={feature.content?.body_text || ''}
            onChange={(e) => updateNestedField('content', 'body_text', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-24 resize-none"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">CTA Text</label>
            <Input
              value={feature.content?.cta_text || ''}
              onChange={(e) => updateNestedField('content', 'cta_text', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CTA URL</label>
            <Input
              value={feature.content?.cta_url || ''}
              onChange={(e) => updateNestedField('content', 'cta_url', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Style */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Layout className="w-5 h-5 text-gray-400" />
        Section Style
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <Input
            type="color"
            value={feature.style?.background_color || '#ffffff'}
            onChange={(e) => updateNestedField('style', 'background_color', e.target.value)}
            className="h-10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Text Color</label>
          <Input
            type="color"
            value={feature.style?.text_color || '#000000'}
            onChange={(e) => updateNestedField('style', 'text_color', e.target.value)}
            className="h-10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Padding</label>
          <select
            value={feature.style?.padding || 'default'}
            onChange={(e) => updateNestedField('style', 'padding', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="compact">Compact</option>
            <option value="default">Default</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
      </div>
    </div>

    {/* Order */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4">Display Order</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Order (lower = higher position)</label>
        <Input
          type="number"
          value={feature.order || 0}
          onChange={(e) => updateField('order', parseInt(e.target.value))}
          className="max-w-xs"
        />
      </div>
    </div>
  </>
);

// ==================== PLATFORM FEATURE SETTINGS ====================

const PlatformFeatureSettings = ({ feature, updateField }) => (
  <>
    {/* Access Control */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-gray-400" />
        Access Control
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Admin Notes</label>
          <textarea
            value={feature.admin_description || ''}
            onChange={(e) => updateField('admin_description', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
            placeholder="Internal notes for admins..."
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={feature.track_analytics !== false}
            onChange={(e) => updateField('track_analytics', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Track Analytics Events</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={feature.show_in_dashboard !== false}
            onChange={(e) => updateField('show_in_dashboard', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show in User Dashboard</span>
        </label>
      </div>
    </div>

    {/* UI Settings */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4">UI Configuration</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
          <Input
            value={feature.icon || ''}
            onChange={(e) => updateField('icon', e.target.value)}
            placeholder="📊"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dashboard Order</label>
          <Input
            type="number"
            value={feature.dashboard_order || 0}
            onChange={(e) => updateField('dashboard_order', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  </>
);

// ==================== PAYMENT SETTINGS ====================

const PaymentSettings = ({ feature, updateField }) => (
  <>
    {/* Mode & Status */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-gray-400" />
        Payment Configuration
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mode</label>
          <select
            value={feature.mode || 'test'}
            onChange={(e) => updateField('mode', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="test">Test Mode</option>
            <option value="live">Live Mode</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Default Currency</label>
          <select
            value={feature.default_currency || 'USD'}
            onChange={(e) => updateField('default_currency', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Amount</label>
          <Input
            type="number"
            value={feature.min_amount || 1}
            onChange={(e) => updateField('min_amount', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Amount</label>
          <Input
            type="number"
            value={feature.max_amount || 10000}
            onChange={(e) => updateField('max_amount', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>

    {/* API Keys */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-gray-400" />
        API Credentials
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <Input
            type="password"
            value={feature.api_key || ''}
            onChange={(e) => updateField('api_key', e.target.value)}
            placeholder="sk_live_..."
          />
          {feature.api_key_masked && (
            <p className="text-xs text-gray-500 mt-1">Current: {feature.api_key_masked}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">API Secret</label>
          <Input
            type="password"
            value={feature.api_secret || ''}
            onChange={(e) => updateField('api_secret', e.target.value)}
            placeholder="Enter new secret..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Public Key</label>
          <Input
            value={feature.public_key || ''}
            onChange={(e) => updateField('public_key', e.target.value)}
            placeholder="pk_live_..."
          />
        </div>
      </div>
    </div>

    {/* Webhook Status */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4">Webhook Status</h3>
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${
          feature.webhook?.status === 'active' ? 'bg-green-500' :
          feature.webhook?.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
        <span className="capitalize">{feature.webhook?.status || 'Inactive'}</span>
        {feature.webhook?.last_event_at && (
          <span className="text-sm text-gray-500">
            Last event: {new Date(feature.webhook.last_event_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  </>
);

// ==================== AUTH SETTINGS ====================

const AuthSettings = ({ feature, updateField, updateNestedField }) => (
  <>
    {/* Requirements */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-gray-400" />
        Authentication Settings
      </h3>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Security Level</label>
            <select
              value={feature.security_level || 'medium'}
              onChange={(e) => updateField('security_level', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session Duration (hours)</label>
            <Input
              type="number"
              value={feature.session_duration_hours || 24}
              onChange={(e) => updateField('session_duration_hours', parseInt(e.target.value))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={feature.required || false}
            onChange={(e) => updateField('required', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Required for all users</span>
        </label>
      </div>
    </div>

    {/* Provider Credentials */}
    {feature.provider !== 'totp' && (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-400" />
          Provider Credentials
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client ID</label>
            <Input
              value={feature.credentials?.client_id || ''}
              onChange={(e) => updateNestedField('credentials', 'client_id', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client Secret</label>
            <Input
              type="password"
              value={feature.credentials?.client_secret || ''}
              onChange={(e) => updateNestedField('credentials', 'client_secret', e.target.value)}
              placeholder="Enter new secret..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Redirect URI</label>
            <Input
              value={feature.credentials?.redirect_uri || ''}
              onChange={(e) => updateNestedField('credentials', 'redirect_uri', e.target.value)}
            />
          </div>
        </div>
      </div>
    )}

    {/* Security Settings */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-4">Security Limits</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Max Login Attempts</label>
          <Input
            type="number"
            value={feature.max_attempts || 5}
            onChange={(e) => updateField('max_attempts', parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lockout Duration (minutes)</label>
          <Input
            type="number"
            value={feature.lockout_duration_minutes || 30}
            onChange={(e) => updateField('lockout_duration_minutes', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  </>
);

export default FeatureManagement;
