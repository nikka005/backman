import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Lock, Mail, Eye, EyeOff, Shield, Loader2, AlertCircle } from 'lucide-react';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      // Check if user is admin
      if (result.user?.role !== 'admin' && result.user?.role !== 'manager') {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }
      
      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
        </div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-pink-100 text-sm mt-1">Adverlyx Digital Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@adverlyx.com"
                    className="pl-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 h-12 rounded-xl"
                    required
                    data-testid="admin-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 pr-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 h-12 rounded-xl"
                    required
                    data-testid="admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-xl"
              data-testid="admin-login-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Access Admin Panel
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-gray-500 text-xs">
                Authorized personnel only. All access is logged.
              </p>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            🔒 Secured with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
