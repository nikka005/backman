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
  GripVertical, Eye, EyeOff
} from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      setSettings(response.data);
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
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
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
        <Button onClick={loadSettings} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
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

// Feature Toggles Component
const FeatureToggles = ({ features, onUpdate, onSave, saving }) => {
  if (!features) return null;

  const pageFeatures = [
    { key: 'page_home', label: 'Home Page' },
    { key: 'page_pricing', label: 'Pricing Page' },
    { key: 'page_how_it_works', label: 'How It Works Page' },
    { key: 'page_case_studies', label: 'Case Studies Page' },
    { key: 'page_faq', label: 'FAQ Page' },
    { key: 'page_contact', label: 'Contact Page' },
    { key: 'page_blog', label: 'Blog Page' },
  ];

  const sectionFeatures = [
    { key: 'section_hero', label: 'Hero Section' },
    { key: 'section_trusted_brands', label: 'Trusted Brands' },
    { key: 'section_testimonials', label: 'Testimonials' },
    { key: 'section_stats', label: 'Statistics' },
    { key: 'section_benefits', label: 'Benefits' },
    { key: 'section_how_it_works', label: 'How It Works' },
    { key: 'section_pricing', label: 'Pricing Section' },
    { key: 'section_faq', label: 'FAQ Section' },
    { key: 'section_reviews', label: 'Reviews' },
  ];

  const platformFeatures = [
    { key: 'feature_instagram_connect', label: 'Instagram Connect' },
    { key: 'feature_pause_resume', label: 'Pause/Resume Growth' },
    { key: 'feature_targeting', label: 'Advanced Targeting' },
    { key: 'feature_analytics', label: 'Analytics Dashboard' },
    { key: 'feature_support_tickets', label: 'Support Tickets' },
    { key: 'feature_live_chat', label: 'Live Chat' },
  ];

  const paymentFeatures = [
    { key: 'feature_stripe', label: 'Stripe Payments' },
    { key: 'feature_razorpay', label: 'Razorpay' },
    { key: 'feature_paypal', label: 'PayPal' },
    { key: 'feature_coupons', label: 'Discount Coupons' },
  ];

  const authFeatures = [
    { key: 'feature_google_login', label: 'Google Login' },
    { key: 'feature_email_verification', label: 'Email Verification' },
    { key: 'feature_two_factor', label: 'Two-Factor Auth' },
  ];

  return (
    <div className="space-y-6">
      <FeatureSection title="Pages" features={pageFeatures} values={features} onUpdate={onUpdate} />
      <FeatureSection title="Homepage Sections" features={sectionFeatures} values={features} onUpdate={onUpdate} />
      <FeatureSection title="Platform Features" features={platformFeatures} values={features} onUpdate={onUpdate} />
      <FeatureSection title="Payment Options" features={paymentFeatures} values={features} onUpdate={onUpdate} />
      <FeatureSection title="Authentication" features={authFeatures} values={features} onUpdate={onUpdate} />

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} data-testid="save-features-btn" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Features
        </Button>
      </div>
    </div>
  );
};

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
