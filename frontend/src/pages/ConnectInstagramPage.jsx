import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { instagramAPI } from '../services/api';
import { 
  Instagram, Shield, Check, AlertTriangle, Loader2,
  Lock, Eye, TrendingUp, Users, Zap, ArrowRight, Sparkles
} from 'lucide-react';
import AIOnboardingRecommendations from '../components/AIOnboardingRecommendations';

const ConnectInstagramPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAIOnboarding, setShowAIOnboarding] = useState(false);
  const [connectionComplete, setConnectionComplete] = useState(false);

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
      
      // Show AI onboarding instead of navigating directly
      setConnectionComplete(true);
      setShowAIOnboarding(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect Instagram account');
    } finally {
      setLoading(false);
    }
  };

  const handleAIOnboardingComplete = (recommendation) => {
    // Navigate to dashboard with recommendation data
    navigate('/dashboard', { 
      state: { 
        connected: true, 
        aiRecommendation: recommendation,
        showTargeting: true 
      } 
    });
  };

  const handleAIOnboardingSkip = () => {
    navigate('/dashboard', { state: { connected: true } });
  };

  // Show AI Onboarding if connection is complete
  if (showAIOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex items-center justify-center p-4 md:p-8">
        <AIOnboardingRecommendations 
          onComplete={handleAIOnboardingComplete}
          onSkip={handleAIOnboardingSkip}
        />
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 min-h-screen lg:min-h-0">
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6 md:mb-8">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Instagram className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Connect Instagram</h1>
            <p className="text-gray-500 text-sm md:text-base">Link your account to start growing</p>
          </div>

          {error && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-xs md:text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleConnect}>
            <div className="mb-4 md:mb-6">
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
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
              {features.map((feature) => (
                <div key={feature.title} className="text-center p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl">
                  <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-[10px] md:text-xs font-medium text-gray-900">{feature.title}</p>
                </div>
              ))}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 md:gap-3 mb-4 md:mb-6">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                data-testid="agree-terms-checkbox"
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs md:text-sm text-gray-600 leading-tight cursor-pointer">
                I understand that Adverlyx uses organic growth methods and accept the{' '}
                <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full h-11 md:h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold gap-2"
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
            
            {/* AI Setup Hint */}
            <div className="flex items-center justify-center gap-2 mt-3 text-[10px] md:text-xs text-gray-500">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-pink-500" />
              <span>AI will recommend optimal settings after connection</span>
            </div>
          </form>

          <p className="text-center text-[10px] md:text-xs text-gray-400 mt-4 md:mt-6">
            By connecting, you agree to our privacy policy
          </p>
        </div>
      </div>

      {/* Right Side - Benefits (hidden on mobile) */}
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
