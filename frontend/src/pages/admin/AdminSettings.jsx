import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Palette, Type, Layout, Zap, Image, BarChart3, Bell, 
  Save, RefreshCw, Loader2, Check, X, Plus, Trash2, Edit2,
  GripVertical, Eye, EyeOff, ExternalLink
} from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    if (settings && originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      setSettings(response.data);
      setOriginalSettings(JSON.parse(JSON.stringify(response.data)));
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section, data) => {
    try {
      setSaving(true);
      if (section === 'branding') {
        await adminAPI.updateBranding(data);
      } else if (section === 'ui') {
        await adminAPI.updateUISettings(data);
      } else if (section === 'features') {
        await adminAPI.updateFeatureToggles(data);
      } else if (section === 'hero') {
        await adminAPI.updateHeroContent(data);
      } else if (section === 'stats') {
        await adminAPI.updateStatsContent(data);
      } else if (section === 'promo_banner') {
        await adminAPI.updatePromoBanner(data);
      }
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setMessage({ type: 'success', text: 'Changes discarded' });
    setTimeout(() => setMessage(null), 2000);
  };

  const openPreview = () => {
    // Open homepage in new tab with preview mode
    const previewUrl = `${window.location.origin}/?preview=true&t=${Date.now()}`;
    window.open(previewUrl, '_blank');
    setShowPreview(true);
  };

  const updateNestedSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-settings-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-500">Configure branding, UI, and platform features</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={openPreview} variant="outline" className="gap-2" data-testid="preview-btn">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          {hasChanges && (
            <Button onClick={discardChanges} variant="outline" className="gap-2 text-red-600 hover:text-red-700">
              <X className="w-4 h-4" />
              Discard
            </Button>
          )}
          <Button onClick={loadSettings} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
          <TabsTrigger value="branding" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Palette className="w-4 h-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Layout className="w-4 h-4" /> UI Settings
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Zap className="w-4 h-4" /> Features
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Type className="w-4 h-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="promo" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Bell className="w-4 h-4" /> Promo Banner
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <BrandingSettings 
            branding={settings?.branding} 
            onUpdate={(key, value) => updateNestedSetting('branding', key, value)}
            onSave={() => saveSettings('branding', settings.branding)}
            saving={saving}
          />
        </TabsContent>

        {/* UI Settings Tab */}
        <TabsContent value="ui">
          <UISettingsPanel 
            ui={settings?.ui}
            onUpdate={(key, value) => updateNestedSetting('ui', key, value)}
            onSave={() => saveSettings('ui', settings.ui)}
            saving={saving}
          />
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <FeatureToggles 
            features={settings?.features}
            onUpdate={(key, value) => updateNestedSetting('features', key, value)}
            onSave={() => saveSettings('features', settings.features)}
            saving={saving}
          />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <ContentSettings 
            hero={settings?.hero}
            stats={settings?.stats}
            onUpdateHero={(key, value) => updateNestedSetting('hero', key, value)}
            onUpdateStats={(key, value) => updateNestedSetting('stats', key, value)}
            onSaveHero={() => saveSettings('hero', settings.hero)}
            onSaveStats={() => saveSettings('stats', settings.stats)}
            saving={saving}
          />
        </TabsContent>

        {/* Promo Banner Tab */}
        <TabsContent value="promo">
          <PromoBannerSettings 
            banner={settings?.promo_banner}
            onUpdate={(key, value) => updateNestedSetting('promo_banner', key, value)}
            onSave={() => saveSettings('promo_banner', settings.promo_banner)}
            saving={saving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Branding Settings Component
const BrandingSettings = ({ branding, onUpdate, onSave, saving }) => {
  if (!branding) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-500" />
          Brand Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="brand_name">Brand Name</Label>
            <Input 
              id="brand_name"
              data-testid="branding-brand-name"
              value={branding.brand_name || ''} 
              onChange={(e) => onUpdate('brand_name', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input 
              id="tagline"
              data-testid="branding-tagline"
              value={branding.tagline || ''} 
              onChange={(e) => onUpdate('tagline', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="font_family">Font Family</Label>
            <Input 
              id="font_family"
              data-testid="branding-font-family"
              value={branding.font_family || ''} 
              onChange={(e) => onUpdate('font_family', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="heading_font">Heading Font</Label>
            <Input 
              id="heading_font"
              data-testid="branding-heading-font"
              value={branding.heading_font || ''} 
              onChange={(e) => onUpdate('heading_font', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-500" />
          Colors
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ColorInput label="Primary" color={branding.primary_color} onChange={(v) => onUpdate('primary_color', v)} testId="branding-primary-color" />
          <ColorInput label="Secondary" color={branding.secondary_color} onChange={(v) => onUpdate('secondary_color', v)} testId="branding-secondary-color" />
          <ColorInput label="Accent" color={branding.accent_color} onChange={(v) => onUpdate('accent_color', v)} testId="branding-accent-color" />
          <ColorInput label="Success" color={branding.success_color} onChange={(v) => onUpdate('success_color', v)} testId="branding-success-color" />
          <ColorInput label="Warning" color={branding.warning_color} onChange={(v) => onUpdate('warning_color', v)} testId="branding-warning-color" />
          <ColorInput label="Error" color={branding.error_color} onChange={(v) => onUpdate('error_color', v)} testId="branding-error-color" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-500" />
          Gradient Colors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorInput label="Gradient Start" color={branding.gradient_start} onChange={(v) => onUpdate('gradient_start', v)} testId="branding-gradient-start" />
          <ColorInput label="Gradient Middle" color={branding.gradient_middle} onChange={(v) => onUpdate('gradient_middle', v)} testId="branding-gradient-middle" />
          <ColorInput label="Gradient End" color={branding.gradient_end} onChange={(v) => onUpdate('gradient_end', v)} testId="branding-gradient-end" />
        </div>
        <div className="mt-4 h-12 rounded-xl" style={{
          background: `linear-gradient(to right, ${branding.gradient_start}, ${branding.gradient_middle}, ${branding.gradient_end})`
        }} />
      </div>

      {/* Live Preview Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-pink-500" />
          Live Preview
        </h3>
        <div className="border rounded-xl p-6 bg-gray-50">
          {/* Mini Hero Preview */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: branding.font_family }}>
              {branding.brand_name || 'Brand Name'}
            </p>
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ 
                fontFamily: branding.heading_font || branding.font_family,
                background: `linear-gradient(to right, ${branding.gradient_start}, ${branding.gradient_middle}, ${branding.gradient_end})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {branding.tagline || 'Your Tagline Here'}
            </h2>
            <button 
              className="px-6 py-2 rounded-full text-white font-medium text-sm"
              style={{ backgroundColor: branding.primary_color }}
            >
              Get Started
            </button>
          </div>
          {/* Color Swatches */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.primary_color }} title="Primary" />
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.secondary_color }} title="Secondary" />
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.accent_color }} title="Accent" />
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.success_color }} title="Success" />
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.warning_color }} title="Warning" />
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: branding.error_color }} title="Error" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} data-testid="save-branding-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Branding
        </Button>
      </div>
    </div>
  );
};

// Color Input Component
const ColorInput = ({ label, color, onChange, testId }) => (
  <div>
    <Label className="text-sm text-gray-600">{label}</Label>
    <div className="flex items-center gap-2 mt-1">
      <input 
        type="color" 
        value={color || '#000000'} 
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer"
        data-testid={testId}
      />
      <Input 
        value={color || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm"
      />
    </div>
  </div>
);

// UI Settings Component
const UISettingsPanel = ({ ui, onUpdate, onSave, saving }) => {
  if (!ui) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5 text-pink-500" />
          Theme & Appearance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label>Default Theme</Label>
            <select 
              value={ui.default_theme || 'light'}
              onChange={(e) => onUpdate('default_theme', e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg"
              data-testid="ui-default-theme"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <Label>Button Style</Label>
            <select 
              value={ui.button_style || 'pill'}
              onChange={(e) => onUpdate('button_style', e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg"
              data-testid="ui-button-style"
            >
              <option value="rounded">Rounded</option>
              <option value="square">Square</option>
              <option value="pill">Pill</option>
            </select>
          </div>
          <div>
            <Label>Card Radius</Label>
            <select 
              value={ui.card_radius || 'xl'}
              onChange={(e) => onUpdate('card_radius', e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg"
              data-testid="ui-card-radius"
            >
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
              <option value="2xl">2XL</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-pink-500" />
          Animations & Effects
        </h3>
        <div className="space-y-4">
          <ToggleRow 
            label="Enable Animations" 
            description="Enable page and element animations"
            checked={ui.animations_enabled} 
            onChange={(v) => onUpdate('animations_enabled', v)}
            testId="ui-animations-enabled"
          />
          <ToggleRow 
            label="Scroll Animations" 
            description="Animate elements on scroll"
            checked={ui.scroll_animations} 
            onChange={(v) => onUpdate('scroll_animations', v)}
            testId="ui-scroll-animations"
          />
          <ToggleRow 
            label="Hover Effects" 
            description="Enable hover effects on interactive elements"
            checked={ui.hover_effects} 
            onChange={(v) => onUpdate('hover_effects', v)}
            testId="ui-hover-effects"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5 text-pink-500" />
          Navigation & Footer
        </h3>
        <div className="space-y-4">
          <ToggleRow 
            label="Sticky Navbar" 
            description="Keep navbar fixed at top while scrolling"
            checked={ui.navbar_sticky} 
            onChange={(v) => onUpdate('navbar_sticky', v)}
            testId="ui-navbar-sticky"
          />
          <ToggleRow 
            label="Show Promo Banner" 
            description="Display promotional banner at top"
            checked={ui.show_promo_banner} 
            onChange={(v) => onUpdate('show_promo_banner', v)}
            testId="ui-show-promo-banner"
          />
          <ToggleRow 
            label="Show Newsletter" 
            description="Show newsletter signup in footer"
            checked={ui.show_newsletter} 
            onChange={(v) => onUpdate('show_newsletter', v)}
            testId="ui-show-newsletter"
          />
          <ToggleRow 
            label="Show Social Links" 
            description="Display social media links in footer"
            checked={ui.show_social_links} 
            onChange={(v) => onUpdate('show_social_links', v)}
            testId="ui-show-social-links"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} data-testid="save-ui-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save UI Settings
        </Button>
      </div>
    </div>
  );
};

// Toggle Row Component
const ToggleRow = ({ label, description, checked, onChange, testId }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
  </div>
);

// Feature Toggles Component - Enhanced with full management
const FeatureToggles = ({ features, onUpdate, onSave, saving }) => {
  const [expandedFeature, setExpandedFeature] = useState(null);
  
  if (!features) return null;

  const pageFeatures = [
    { key: 'page_home', label: 'Home Page', description: 'Main landing page of the website', icon: '🏠' },
    { key: 'page_pricing', label: 'Pricing Page', description: 'Display subscription plans and pricing', icon: '💰' },
    { key: 'page_how_it_works', label: 'How It Works Page', description: 'Explain the growth process', icon: '📖' },
    { key: 'page_case_studies', label: 'Case Studies Page', description: 'Show success stories', icon: '📊' },
    { key: 'page_faq', label: 'FAQ Page', description: 'Frequently asked questions', icon: '❓' },
    { key: 'page_contact', label: 'Contact Page', description: 'Contact form and info', icon: '📞' },
    { key: 'page_blog', label: 'Blog Page', description: 'Blog articles and news', icon: '📝' },
  ];

  const sectionFeatures = [
    { key: 'section_hero', label: 'Hero Section', description: 'Main banner with CTA', icon: '🎯' },
    { key: 'section_trusted_brands', label: 'Trusted Brands', description: 'Show brand logos', icon: '🏢' },
    { key: 'section_testimonials', label: 'Testimonials', description: 'Customer reviews', icon: '⭐' },
    { key: 'section_stats', label: 'Statistics', description: 'Platform stats counter', icon: '📈' },
    { key: 'section_benefits', label: 'Benefits', description: 'Feature benefits list', icon: '✅' },
    { key: 'section_how_it_works', label: 'How It Works', description: 'Step by step guide', icon: '🔄' },
    { key: 'section_pricing', label: 'Pricing Section', description: 'Pricing on homepage', icon: '💳' },
    { key: 'section_faq', label: 'FAQ Section', description: 'FAQ on homepage', icon: '💬' },
    { key: 'section_reviews', label: 'Reviews', description: 'User reviews section', icon: '👍' },
  ];

  const platformFeatures = [
    { key: 'feature_instagram_connect', label: 'Instagram Connect', description: 'Allow users to connect IG accounts', icon: '📸', critical: true },
    { key: 'feature_pause_resume', label: 'Pause/Resume Growth', description: 'Let users pause their growth', icon: '⏸️' },
    { key: 'feature_targeting', label: 'Advanced Targeting', description: 'Custom targeting options', icon: '🎯' },
    { key: 'feature_analytics', label: 'Analytics Dashboard', description: 'User analytics and stats', icon: '📊' },
    { key: 'feature_support_tickets', label: 'Support Tickets', description: 'In-app support system', icon: '🎫' },
    { key: 'feature_live_chat', label: 'Live Chat', description: 'Real-time chat support', icon: '💬' },
  ];

  const paymentFeatures = [
    { key: 'feature_stripe', label: 'Stripe Payments', description: 'Accept card payments via Stripe', icon: '💳', critical: true },
    { key: 'feature_razorpay', label: 'Razorpay', description: 'Indian payment gateway', icon: '🇮🇳' },
    { key: 'feature_paypal', label: 'PayPal', description: 'PayPal checkout option', icon: '🅿️' },
    { key: 'feature_coupons', label: 'Discount Coupons', description: 'Promo code system', icon: '🏷️' },
  ];

  const authFeatures = [
    { key: 'feature_google_login', label: 'Google Login', description: 'Social login with Google', icon: '🔑' },
    { key: 'feature_email_verification', label: 'Email Verification', description: 'Verify user emails', icon: '✉️' },
    { key: 'feature_two_factor', label: 'Two-Factor Auth', description: '2FA for extra security', icon: '🔐' },
  ];

  const enableAll = (featureGroup) => {
    featureGroup.forEach(f => onUpdate(f.key, true));
  };

  const disableAll = (featureGroup) => {
    featureGroup.forEach(f => onUpdate(f.key, false));
  };

  const getEnabledCount = (featureGroup) => {
    return featureGroup.filter(f => features[f.key]).length;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Feature Management</h3>
          <p className="text-sm text-gray-600">Enable or disable platform features. Changes take effect immediately after saving.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              enableAll([...pageFeatures, ...sectionFeatures, ...platformFeatures, ...paymentFeatures, ...authFeatures]);
            }}
          >
            Enable All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-600 border-red-200"
            onClick={() => {
              if (window.confirm('Are you sure you want to disable all features?')) {
                disableAll([...pageFeatures, ...sectionFeatures, ...platformFeatures, ...paymentFeatures, ...authFeatures]);
              }
            }}
          >
            Disable All
          </Button>
        </div>
      </div>

      <EnhancedFeatureSection 
        title="Pages" 
        description="Control which pages are accessible"
        features={pageFeatures} 
        values={features} 
        onUpdate={onUpdate}
        enableAll={() => enableAll(pageFeatures)}
        disableAll={() => disableAll(pageFeatures)}
        enabledCount={getEnabledCount(pageFeatures)}
        expandedFeature={expandedFeature}
        setExpandedFeature={setExpandedFeature}
      />
      
      <EnhancedFeatureSection 
        title="Homepage Sections" 
        description="Show or hide sections on the homepage"
        features={sectionFeatures} 
        values={features} 
        onUpdate={onUpdate}
        enableAll={() => enableAll(sectionFeatures)}
        disableAll={() => disableAll(sectionFeatures)}
        enabledCount={getEnabledCount(sectionFeatures)}
        expandedFeature={expandedFeature}
        setExpandedFeature={setExpandedFeature}
      />
      
      <EnhancedFeatureSection 
        title="Platform Features" 
        description="Core platform functionality"
        features={platformFeatures} 
        values={features} 
        onUpdate={onUpdate}
        enableAll={() => enableAll(platformFeatures)}
        disableAll={() => disableAll(platformFeatures)}
        enabledCount={getEnabledCount(platformFeatures)}
        expandedFeature={expandedFeature}
        setExpandedFeature={setExpandedFeature}
      />
      
      <EnhancedFeatureSection 
        title="Payment Options" 
        description="Configure payment gateways"
        features={paymentFeatures} 
        values={features} 
        onUpdate={onUpdate}
        enableAll={() => enableAll(paymentFeatures)}
        disableAll={() => disableAll(paymentFeatures)}
        enabledCount={getEnabledCount(paymentFeatures)}
        expandedFeature={expandedFeature}
        setExpandedFeature={setExpandedFeature}
      />
      
      <EnhancedFeatureSection 
        title="Authentication" 
        description="Login and security options"
        features={authFeatures} 
        values={features} 
        onUpdate={onUpdate}
        enableAll={() => enableAll(authFeatures)}
        disableAll={() => disableAll(authFeatures)}
        enabledCount={getEnabledCount(authFeatures)}
        expandedFeature={expandedFeature}
        setExpandedFeature={setExpandedFeature}
      />

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} data-testid="save-features-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Features
        </Button>
      </div>
    </div>
  );
};

const EnhancedFeatureSection = ({ 
  title, 
  description, 
  features, 
  values, 
  onUpdate, 
  enableAll, 
  disableAll, 
  enabledCount,
  expandedFeature,
  setExpandedFeature
}) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={enabledCount === features.length ? 'bg-green-100 text-green-700' : enabledCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}>
          {enabledCount}/{features.length} enabled
        </Badge>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={enableAll} className="text-green-600 hover:bg-green-50">
            <Check className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={disableAll} className="text-red-600 hover:bg-red-50">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    <div className="divide-y">
      {features.map((feature) => (
        <div 
          key={feature.key} 
          className={`p-4 transition-colors ${values[feature.key] ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl">{feature.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{feature.label}</span>
                  {feature.critical && (
                    <Badge className="bg-red-100 text-red-700 text-xs">Critical</Badge>
                  )}
                  {!values[feature.key] && (
                    <Badge className="bg-gray-200 text-gray-600 text-xs">Disabled</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${values[feature.key] ? 'bg-green-500' : 'bg-gray-300'}`} />
              <Switch 
                checked={values[feature.key] || false} 
                onCheckedChange={(v) => onUpdate(feature.key, v)}
                data-testid={`feature-${feature.key}`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FeatureSection = ({ title, features, values, onUpdate }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature) => (
        <div key={feature.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">{feature.label}</span>
          <Switch 
            checked={values[feature.key]} 
            onCheckedChange={(v) => onUpdate(feature.key, v)}
            data-testid={`feature-${feature.key}`}
          />
        </div>
      ))}
    </div>
  </div>
);

// Content Settings Component
const ContentSettings = ({ hero, stats, onUpdateHero, onUpdateStats, onSaveHero, onSaveStats, saving }) => {
  if (!hero || !stats) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Type className="w-5 h-5 text-pink-500" />
          Hero Section Content
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Headline Prefix</Label>
            <Input 
              value={hero.headline_prefix || ''} 
              onChange={(e) => onUpdateHero('headline_prefix', e.target.value)}
              className="mt-1"
              data-testid="hero-headline-prefix"
            />
          </div>
          <div>
            <Label>Subheadline</Label>
            <Input 
              value={hero.subheadline || ''} 
              onChange={(e) => onUpdateHero('subheadline', e.target.value)}
              className="mt-1"
              data-testid="hero-subheadline"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <textarea 
              value={hero.description || ''} 
              onChange={(e) => onUpdateHero('description', e.target.value)}
              className="mt-1 w-full p-3 border rounded-lg resize-none"
              rows={3}
              data-testid="hero-description"
            />
          </div>
          <div>
            <Label>CTA Button Text</Label>
            <Input 
              value={hero.cta_text || ''} 
              onChange={(e) => onUpdateHero('cta_text', e.target.value)}
              className="mt-1"
              data-testid="hero-cta-text"
            />
          </div>
          <div>
            <Label>CTA Button Link</Label>
            <Input 
              value={hero.cta_link || ''} 
              onChange={(e) => onUpdateHero('cta_link', e.target.value)}
              className="mt-1"
              data-testid="hero-cta-link"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onSaveHero} disabled={saving} data-testid="save-hero-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Hero Content
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pink-500" />
          Platform Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Happy Users</Label>
            <Input 
              value={stats.happy_users || ''} 
              onChange={(e) => onUpdateStats('happy_users', e.target.value)}
              className="mt-1"
              data-testid="stats-happy-users"
            />
          </div>
          <div>
            <Label>New Fans Monthly</Label>
            <Input 
              value={stats.new_fans_monthly || ''} 
              onChange={(e) => onUpdateStats('new_fans_monthly', e.target.value)}
              className="mt-1"
              data-testid="stats-new-fans"
            />
          </div>
          <div>
            <Label>Hours Saved</Label>
            <Input 
              value={stats.hours_saved || ''} 
              onChange={(e) => onUpdateStats('hours_saved', e.target.value)}
              className="mt-1"
              data-testid="stats-hours-saved"
            />
          </div>
          <div>
            <Label>Satisfaction Score</Label>
            <Input 
              value={stats.satisfaction_score || ''} 
              onChange={(e) => onUpdateStats('satisfaction_score', e.target.value)}
              className="mt-1"
              data-testid="stats-satisfaction"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onSaveStats} disabled={saving} data-testid="save-stats-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Statistics
          </Button>
        </div>
      </div>
    </div>
  );
};

// Promo Banner Settings Component
const PromoBannerSettings = ({ banner, onUpdate, onSave, saving }) => {
  if (!banner) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-pink-500" />
          Promotional Banner
        </h3>
        
        <div className="mb-6">
          <ToggleRow 
            label="Enable Promo Banner" 
            description="Show promotional banner at the top of the site"
            checked={banner.enabled} 
            onChange={(v) => onUpdate('enabled', v)}
            testId="promo-enabled"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Banner Message (HTML supported)</Label>
            <textarea 
              value={banner.message || ''} 
              onChange={(e) => onUpdate('message', e.target.value)}
              className="mt-1 w-full p-3 border rounded-lg resize-none font-mono text-sm"
              rows={2}
              data-testid="promo-message"
            />
          </div>
          <div>
            <Label>Link URL</Label>
            <Input 
              value={banner.link || ''} 
              onChange={(e) => onUpdate('link', e.target.value)}
              className="mt-1"
              data-testid="promo-link"
            />
          </div>
          <div>
            <Label>Background Gradient</Label>
            <Input 
              value={banner.background_gradient || ''} 
              onChange={(e) => onUpdate('background_gradient', e.target.value)}
              className="mt-1 font-mono text-sm"
              placeholder="from-orange-500 via-pink-500 to-purple-500"
              data-testid="promo-gradient"
            />
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <ToggleRow 
            label="Show Countdown Timer" 
            description="Display urgency countdown timer"
            checked={banner.show_countdown} 
            onChange={(v) => onUpdate('show_countdown', v)}
            testId="promo-show-countdown"
          />
          
          {banner.show_countdown && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <Label>Hours</Label>
                <Input 
                  type="number"
                  value={banner.countdown_hours || 0} 
                  onChange={(e) => onUpdate('countdown_hours', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="promo-countdown-hours"
                />
              </div>
              <div>
                <Label>Minutes</Label>
                <Input 
                  type="number"
                  value={banner.countdown_minutes || 0} 
                  onChange={(e) => onUpdate('countdown_minutes', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="promo-countdown-minutes"
                />
              </div>
              <div>
                <Label>Seconds</Label>
                <Input 
                  type="number"
                  value={banner.countdown_seconds || 0} 
                  onChange={(e) => onUpdate('countdown_seconds', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="promo-countdown-seconds"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mt-6 border-t pt-6">
          <Label className="mb-2 block">Preview</Label>
          <div className={`p-3 text-white text-center text-sm font-medium rounded-lg bg-gradient-to-r ${banner.background_gradient || 'from-orange-500 via-pink-500 to-purple-500'}`}>
            <span dangerouslySetInnerHTML={{ __html: banner.message || 'Your promo message here' }} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} data-testid="save-promo-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Promo Banner
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
