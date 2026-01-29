import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Mail, RefreshCw, Loader2, Eye, Send, RotateCcw,
  Check, X, Code, Palette, Variable
} from 'lucide-react';

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Initialize templates if needed
      await adminAPI.initializeEmailTemplates();
      const response = await adminAPI.getEmailTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    // Load preview
    try {
      const response = await adminAPI.previewEmailTemplate(template.key, {});
      setPreviewHtml(response.data.html_content);
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await adminAPI.updateEmailTemplate(selectedTemplate.key, {
        subject: selectedTemplate.subject,
        html_content: selectedTemplate.html_content,
        enabled: selectedTemplate.enabled
      });
      await loadTemplates();
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!selectedTemplate || !testEmail) return;
    setSending(true);
    try {
      await adminAPI.testSendEmailTemplate(selectedTemplate.key, testEmail);
      alert(`Test email sent to ${testEmail}`);
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const handleResetTemplate = async (key) => {
    if (!window.confirm('Reset this template to default?')) return;
    try {
      await adminAPI.resetEmailTemplate(key);
      await loadTemplates();
      if (selectedTemplate?.key === key) {
        const updated = templates.find(t => t.key === key);
        setSelectedTemplate(updated);
      }
      alert('Template reset to default');
    } catch (error) {
      console.error('Error resetting template:', error);
    }
  };

  const updateTemplateField = (field, value) => {
    setSelectedTemplate({ ...selectedTemplate, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="email-templates-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500">Customize transactional email templates</p>
        </div>
        <Button onClick={loadTemplates} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            Templates
          </h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.key}
                onClick={() => handleSelectTemplate(template)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.key === template.key
                    ? 'bg-pink-50 border-2 border-pink-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{template.name}</span>
                  <Badge className={template.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {template.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{template.subject}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTemplate ? (
            <>
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500">Key: {selectedTemplate.key}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Enabled</span>
                      <Switch
                        checked={selectedTemplate.enabled}
                        onCheckedChange={(checked) => updateTemplateField('enabled', checked)}
                      />
                    </label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResetTemplate(selectedTemplate.key)}
                      className="gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Line</label>
                    <Input
                      value={selectedTemplate.subject}
                      onChange={(e) => updateTemplateField('subject', e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Variable className="w-4 h-4" />
                      Available Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(selectedTemplate.variables || []).map((variable) => (
                        <Badge key={variable} variant="outline" className="bg-blue-50">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* HTML Editor */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Code className="w-5 h-5 text-gray-400" />
                    HTML Content
                  </h3>
                </div>
                <textarea
                  value={selectedTemplate.html_content}
                  onChange={(e) => updateTemplateField('html_content', e.target.value)}
                  className="w-full h-64 p-3 font-mono text-sm border rounded-lg resize-none"
                  placeholder="HTML content..."
                />
              </div>

              {/* Preview */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-400" />
                    Preview
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      const response = await adminAPI.previewEmailTemplate(selectedTemplate.key, {});
                      setPreviewHtml(response.data.html_content);
                    }}
                  >
                    Refresh Preview
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '400px' }}>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full"
                    title="Email Preview"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-64"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleTestSend}
                      disabled={sending || !testEmail}
                      className="gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Test
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a template to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEmailTemplates;
