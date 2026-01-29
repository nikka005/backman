import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { instagramAPI } from '../services/api';
import { 
  Instagram, Shield, Check, AlertTriangle, Loader2,
  Lock, Eye, TrendingUp, Users, Zap, ArrowRight
} from 'lucide-react';

const ConnectInstagramPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your Instagram username');
      return;
    }
    
    if (!agreedToTerms) {
      setError('Please accept the terms to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await instagramAPI.connect({
        username: username.trim().replace('@', ''),
        risk_disclaimer_accepted: true
      });
      
      navigate('/dashboard', { state: { connected: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect Instagram account');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, title: 'Account Safe', desc: 'We never store your password' },
    { icon: Lock, title: '100% Secure', desc: 'Bank-level encryption' },
    { icon: Eye, title: 'Privacy First', desc: 'Your data stays private' }
  ];

  const benefits = [
    { icon: TrendingUp, title: 'Organic Growth', value: '1,000-5,000+', desc: 'followers/month' },
    { icon: Users, title: 'Real Followers', value: '100%', desc: 'genuine accounts' },
    { icon: Zap, title: 'AI Targeting', value: '24/7', desc: 'optimization' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Instagram className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Instagram</h1>
            <p className="text-gray-500">Link your account to start growing</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleConnect}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="pl-10 h-12 rounded-xl"
                  data-testid="instagram-username-input"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We&apos;ll never ask for your password
              </p>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {features.map((feature) => (
                <div key={feature.title} className="text-center p-3 bg-gray-50 rounded-xl">
                  <feature.icon className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">{feature.title}</p>
                </div>
              ))}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mb-6">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                data-testid="agree-terms-checkbox"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer">
                I understand that Adverlyx uses organic growth methods and accept the{' '}
                <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold gap-2"
              data-testid="connect-instagram-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Instagram
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            By connecting, you agree to our privacy policy
          </p>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-8">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start Growing<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-yellow-300">
              Today
            </span>
          </h2>
          <p className="text-pink-200 mb-8 text-lg">
            Join thousands of users who have transformed their Instagram presence with our AI-powered growth engine.
          </p>

          {/* Benefits Cards */}
          <div className="space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{benefit.value}</span>
                    <span className="text-pink-200 text-sm">{benefit.desc}</span>
                  </div>
                  <p className="text-white/80 text-sm">{benefit.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-white/80 text-sm">No password required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-white/80 text-sm">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectInstagramPage;
