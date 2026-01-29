import React, { createContext, useContext, useState, useEffect } from 'react';
import { publicAPI } from '../services/api';

const SiteSettingsContext = createContext(null);

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      settings: null,
      loading: true,
      branding: {},
      ui: {},
      features: {},
      hero: {},
      stats: {},
      promoBanner: {},
    };
  }
  return context;
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await publicAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading site settings:', error);
      // Set defaults on error
      setSettings({
        branding: {
          brand_name: 'Adverlyx Digital',
          tagline: 'Smart Growth for Real Brands',
          primary_color: '#ec4899',
          secondary_color: '#f97316',
          accent_color: '#8b5cf6',
        },
        ui: {
          animations_enabled: true,
          show_promo_banner: true,
        },
        features: {},
        hero: {
          headline_prefix: 'Get Real Social Media',
          headline_animated_words: ['Audiences', 'Growth', 'Fans', 'Presence', 'Success'],
          subheadline: 'Using Organic AI-Growth',
          description: 'No bots, no spam, no passwords. See real growth automatically.',
          cta_text: 'Start Growing',
          cta_link: '/signup',
        },
        stats: {
          happy_users: '55,000+',
          new_fans_monthly: '~4,500',
          hours_saved: '7M+',
          satisfaction_score: '9.8/10',
        },
        promo_banner: {
          enabled: true,
          message: '🎉 <strong>50% OFF</strong> Annual Plans | Flash Sale Ends Soon!',
          show_countdown: true,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    settings,
    loading,
    branding: settings?.branding || {},
    ui: settings?.ui || {},
    features: settings?.features || {},
    hero: settings?.hero || {},
    stats: settings?.stats || {},
    promoBanner: settings?.promo_banner || {},
    refreshSettings: loadSettings,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
