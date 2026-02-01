import React, { useState, useEffect } from 'react';
import { i18nAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Globe, RefreshCw, Loader2, Check, Plus, Save, Search, Edit2
} from 'lucide-react';

const AdminLanguages = () => {
  const [languages, setLanguages] = useState({});
  const [settings, setSettings] = useState(null);
  const [translations, setTranslations] = useState({});
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLang) {
      loadTranslations(selectedLang);
    }
  }, [selectedLang]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [langRes, settingsRes] = await Promise.all([
        i18nAPI.getLanguages(),
        i18nAPI.getSettings()
      ]);
      setLanguages(langRes.data.languages || {});
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTranslations = async (lang) => {
    try {
      const res = await i18nAPI.getTranslations(lang);
      setTranslations(res.data.translations || {});
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await i18nAPI.updateSettings(settings);
      alert('Settings saved!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTranslation = async (key) => {
    try {
      await i18nAPI.updateSingleTranslation(selectedLang, key, editValue);
      setTranslations({ ...translations, [key]: editValue });
      setEditingKey(null);
      setEditValue('');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update translation');
    }
  };

  const toggleLanguage = (lang) => {
    const enabled = settings.enabled_languages || [];
    if (enabled.includes(lang)) {
      setSettings({
        ...settings,
        enabled_languages: enabled.filter(l => l !== lang)
      });
    } else {
      setSettings({
        ...settings,
        enabled_languages: [...enabled, lang]
      });
    }
  };

  const filteredTranslations = Object.entries(translations).filter(([key, value]) =>
    !searchTerm ||
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group translations by category
  const groupedTranslations = filteredTranslations.reduce((acc, [key, value]) => {
    const category = key.split('.')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push([key, value]);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-languages">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Language Management</h1>
          <p className="text-gray-500">Configure multi-language support (i18n)</p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-pink-500" />
            Language Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Language</label>
              <select
                value={settings?.default_language || 'en'}
                onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.entries(languages).map(([code, info]) => (
                  <option key={code} value={code}>{info.name} ({info.native})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-Detect Language</span>
              <input
                type="checkbox"
                checked={settings?.auto_detect || false}
                onChange={(e) => setSettings({ ...settings, auto_detect: e.target.checked })}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Enabled Languages</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.entries(languages).map(([code, info]) => (
                  <div
                    key={code}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      settings?.enabled_languages?.includes(code)
                        ? 'bg-pink-50 border-2 border-pink-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                    onClick={() => toggleLanguage(code)}
                  >
                    <div>
                      <p className="font-medium">{info.name}</p>
                      <p className="text-sm text-gray-500">{info.native}</p>
                    </div>
                    {settings?.enabled_languages?.includes(code) && (
                      <Check className="w-5 h-5 text-pink-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Translations Editor */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Translations Editor</h3>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {Object.entries(languages).map(([code, info]) => (
                <option key={code} value={code}>{info.name}</option>
              ))}
            </select>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {Object.entries(groupedTranslations).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">{category}</h4>
                <div className="space-y-2">
                  {items.map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-xs text-pink-600 font-mono">{key}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingKey(key);
                            setEditValue(value);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {editingKey === key ? (
                        <div className="flex gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTranslation(key)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingKey(null);
                              setEditValue('');
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <p className="text-gray-700">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredTranslations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No translations found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLanguages;
