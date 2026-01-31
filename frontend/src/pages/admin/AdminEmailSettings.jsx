import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Mail, Server, Lock, User, Send, CheckCircle, 
  XCircle, Loader2, AlertCircle, Eye, EyeOff, Save, RefreshCw
} from 'lucide-react';

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: 465,
    smtp_username: '',
    smtp_password: '',
    smtp_use_ssl: true,
    sender_email: '',
    sender_name: 'Adverlyx Digital'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEmailSettings();
      setSettings(response.data);
      setTestStatus(response.data.last_test_status);
    } catch (error) {
      console.error('Error loading email settings:', error);
      setMessage({ type: 'error', text: 'Failed to load email settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setSaving(true);
      await adminAPI.updateEmailSettings(settings);
      setMessage({ type: 'success', text: 'Email settings saved successfully!' });
      // Reload to get masked password
      await loadSettings();
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to save email settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    try {
      setTesting(true);
      setMessage(null);
      const response = await adminAPI.testEmailSettings(testEmail);
      setMessage({ type: 'success', text: response.data.message });
      setTestStatus('success');
    } catch (error) {
      console.error('Error testing email:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Test email failed' });
      setTestStatus('failed');
    } finally {
      setTesting(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-email-settings">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
          <p className="text-gray-500">Configure SMTP server for sending emails</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadSettings} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {settings.is_configured && (
            <Badge className={testStatus === 'success' ? 'bg-green-100 text-green-700' : testStatus === 'failed' || testStatus === 'auth_failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
              {testStatus === 'success' ? 'Verified' : testStatus === 'failed' || testStatus === 'auth_failed' ? 'Test Failed' : 'Not Tested'}
            </Badge>
          )}
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMTP Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">SMTP Server Configuration</h2>
                <p className="text-sm text-gray-500">Configure your email server settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Host *</label>
                  <Input
                    value={settings.smtp_host}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    placeholder="smtp.hostinger.com"
                    data-testid="smtp-host-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Port *</label>
                  <Input
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => handleChange('smtp_port', parseInt(e.target.value) || 465)}
                    placeholder="465"
                    data-testid="smtp-port-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SMTP Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={settings.smtp_username}
                    onChange={(e) => handleChange('smtp_username', e.target.value)}
                    placeholder="no-reply@adverlyx.digital"
                    className="pl-10"
                    data-testid="smtp-username-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SMTP Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.smtp_password}
                    onChange={(e) => handleChange('smtp_password', e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 pr-10"
                    data-testid="smtp-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password is encrypted and stored securely</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="ssl-toggle"
                  checked={settings.smtp_use_ssl}
                  onChange={(e) => handleChange('smtp_use_ssl', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                  data-testid="smtp-ssl-toggle"
                />
                <label htmlFor="ssl-toggle" className="text-sm">
                  <span className="font-medium">Use SSL/TLS</span>
                  <span className="text-gray-500 ml-2">Recommended for secure connections (Port 465)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sender Information</h2>
                <p className="text-sm text-gray-500">How your emails will appear to recipients</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sender Email</label>
                <Input
                  value={settings.sender_email}
                  onChange={(e) => handleChange('sender_email', e.target.value)}
                  placeholder="no-reply@adverlyx.digital"
                  data-testid="sender-email-input"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use SMTP username</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sender Name</label>
                <Input
                  value={settings.sender_name}
                  onChange={(e) => handleChange('sender_name', e.target.value)}
                  placeholder="Adverlyx Digital"
                  data-testid="sender-name-input"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2"
            data-testid="save-email-settings-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>

        {/* Test Email & Info Panel */}
        <div className="space-y-6">
          {/* Test Email */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Test Connection</h2>
                <p className="text-sm text-gray-500">Send a test email</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Email Address</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="test-email-input"
                />
              </div>

              <Button 
                onClick={handleTest} 
                disabled={testing || !settings.is_configured}
                variant="outline"
                className="w-full gap-2"
                data-testid="send-test-email-btn"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test Email
              </Button>

              {!settings.is_configured && (
                <p className="text-xs text-orange-600 text-center">
                  Save settings first before testing
                </p>
              )}
            </div>

            {/* Last Test Result */}
            {settings.last_test_at && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Last test:</p>
                <div className="flex items-center gap-2 mt-1">
                  {testStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {testStatus === 'success' ? 'Successful' : 'Failed'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(settings.last_test_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Help Info */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="font-semibold text-purple-900 mb-3">Common SMTP Settings</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="font-medium text-gray-800">Hostinger</p>
                <p className="text-gray-600">Host: smtp.hostinger.com</p>
                <p className="text-gray-600">Port: 465 (SSL) or 587 (TLS)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="font-medium text-gray-800">Gmail</p>
                <p className="text-gray-600">Host: smtp.gmail.com</p>
                <p className="text-gray-600">Port: 465 (SSL) or 587 (TLS)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="font-medium text-gray-800">Outlook</p>
                <p className="text-gray-600">Host: smtp-mail.outlook.com</p>
                <p className="text-gray-600">Port: 587 (TLS)</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p>Your SMTP credentials are stored encrypted. Never share these settings with unauthorized users.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailSettings;
