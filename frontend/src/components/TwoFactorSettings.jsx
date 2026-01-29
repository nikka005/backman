import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { authAPI } from '../services/api';
import { 
  Shield, Smartphone, Copy, Check, Loader2, 
  AlertTriangle, Key, RefreshCw, Lock, Download
} from 'lucide-react';

const TwoFactorSettings = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get2faStatus();
      setStatus(response.data);
    } catch (err) {
      console.error('Error loading 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setProcessing(true);
      setError('');
      const response = await authAPI.setup2fa();
      setSetupData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to setup 2FA');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    try {
      setProcessing(true);
      setError('');
      await authAPI.verify2fa(verifyCode);
      setSetupData(null);
      setVerifyCode('');
      loadStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode) {
      setError('Please enter your 2FA code');
      return;
    }
    
    try {
      setProcessing(true);
      setError('');
      await authAPI.disable2fa(disableCode);
      setDisableCode('');
      loadStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid code');
    } finally {
      setProcessing(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backup_codes) return;
    
    const content = `Adverlyx 2FA Backup Codes\n${'='.repeat(30)}\n\n${setupData.backup_codes.join('\n')}\n\nStore these codes safely. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adverlyx-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="two-factor-settings">
      {/* Status Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status?.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Shield className={`w-6 h-6 ${status?.enabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                {status?.enabled ? 'Your account is protected' : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          <Badge className={status?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
            {status?.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        
        {status?.enabled && (
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Enabled: {new Date(status.enabled_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Backup codes remaining: {status.backup_codes_remaining}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Setup Flow */}
      {!status?.enabled && !setupData && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Enable Two-Factor Authentication</h4>
          <p className="text-gray-600 mb-4">
            Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
          </p>
          <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <Smartphone className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium text-blue-900">You&apos;ll need an authenticator app</p>
              <p className="text-sm text-blue-700">Google Authenticator, Authy, or any TOTP-compatible app</p>
            </div>
          </div>
          <Button 
            onClick={handleSetup} 
            disabled={processing}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
            data-testid="enable-2fa-btn"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Enable 2FA
          </Button>
        </div>
      )}

      {/* QR Code Setup */}
      {setupData && !status?.enabled && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Scan QR Code</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white border rounded-xl mb-4">
                <img src={setupData.qr_code} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Scan this QR code with your authenticator app
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Manual Entry Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                    {setupData.secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Verification Code</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    className="font-mono text-lg tracking-widest"
                    data-testid="2fa-verify-input"
                  />
                  <Button 
                    onClick={handleVerify} 
                    disabled={processing || verifyCode.length !== 6}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="verify-2fa-btn"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Codes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Backup Codes</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(!showBackupCodes)}>
                {showBackupCodes ? 'Hide' : 'Show'}
              </Button>
            </div>
            <p className="text-sm text-yellow-800 mb-3">
              Save these codes somewhere safe. You can use them to access your account if you lose your phone.
            </p>
            {showBackupCodes && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {setupData.backup_codes.map((code, idx) => (
                    <code key={idx} className="p-2 bg-white rounded text-center font-mono text-sm">
                      {code}
                    </code>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={downloadBackupCodes} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup Codes
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Disable 2FA */}
      {status?.enabled && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-red-200">
          <h4 className="font-semibold mb-4 text-red-600">Disable Two-Factor Authentication</h4>
          <p className="text-gray-600 mb-4">
            Disabling 2FA will make your account less secure. Enter your current 2FA code to confirm.
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 2FA code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="max-w-xs font-mono"
              data-testid="disable-2fa-input"
            />
            <Button 
              onClick={handleDisable} 
              disabled={processing || !disableCode}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              data-testid="disable-2fa-btn"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Disable 2FA
            </Button>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes */}
      {status?.enabled && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Regenerate Backup Codes</h4>
              <p className="text-sm text-gray-500">
                {status.backup_codes_remaining} codes remaining. Generate new codes if you've used most of them.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;
