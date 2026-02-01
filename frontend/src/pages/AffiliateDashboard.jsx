import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  DollarSign, Users, Link, Copy, Check, TrendingUp, Gift,
  Loader2, ExternalLink, Share2, CreditCard, Clock, Award
} from 'lucide-react';

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [referralInfo, setReferralInfo] = useState(null);
  const [programInfo, setProgramInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, refRes, progRes] = await Promise.all([
        api.get('/programs/affiliate/dashboard').catch(() => ({ data: null })),
        api.get('/programs/referral/info'),
        api.get('/programs/affiliate/info')
      ]);
      setDashboardData(dashRes.data);
      setReferralInfo(refRes.data);
      setProgramInfo(progRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async (link) => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join Adverlyx',
        text: 'Grow your Instagram with AI-powered tools!',
        url: link
      });
    } else {
      copyLink(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const isAffiliate = dashboardData !== null;
  const referralLink = referralInfo?.referral_link || `https://adverlyx.com/?ref=${referralInfo?.referral_code}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="affiliate-dashboard">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Partner Program</h1>
          <p className="text-gray-500">Earn rewards by referring friends to Adverlyx</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          {isAffiliate && (
            <button
              onClick={() => setActiveTab('affiliate')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'affiliate'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Affiliate Dashboard
            </button>
          )}
          <button
            onClick={() => setActiveTab('referral')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'referral'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Referral Program
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Referral Link Card */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Link className="w-5 h-5" />
                <h3 className="font-semibold">Your Referral Link</h3>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1 bg-transparent border-none text-white placeholder:text-white/50"
                />
                <Button
                  onClick={() => copyLink(referralLink)}
                  className="bg-white text-pink-600 hover:bg-white/90"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => shareLink(referralLink)}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-pink-100 text-sm mt-3">
                Share this link and earn $10 credit for each friend who subscribes!
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                label="Total Referrals"
                value={referralInfo?.total_referrals || 0}
                color="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={Check}
                label="Successful"
                value={referralInfo?.successful_referrals || 0}
                color="from-green-500 to-emerald-500"
              />
              <StatCard
                icon={Clock}
                label="Pending Rewards"
                value={`$${referralInfo?.pending_rewards?.toFixed(2) || '0.00'}`}
                color="from-yellow-500 to-orange-500"
              />
              <StatCard
                icon={DollarSign}
                label="Total Earned"
                value={`$${referralInfo?.total_rewards?.toFixed(2) || '0.00'}`}
                color="from-pink-500 to-rose-500"
              />
            </div>

            {/* Program Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referral Program */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Referral Program</h3>
                    <p className="text-sm text-gray-500">For all users</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>$10 credit for each referral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Friends get 20% off first month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>No limit on referrals</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveTab('referral')} 
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  View Details
                </Button>
              </div>

              {/* Affiliate Program */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Affiliate Program</h3>
                    <p className="text-sm text-gray-500">For content creators & influencers</p>
                  </div>
                  {isAffiliate && <Badge className="bg-green-100 text-green-700">Active</Badge>}
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span>20% commission on all sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span>30-day cookie duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span>Monthly payouts ($50 min)</span>
                  </div>
                </div>
                {isAffiliate ? (
                  <Button 
                    onClick={() => setActiveTab('affiliate')} 
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    View Dashboard
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/affiliate/apply'} 
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Affiliate Dashboard Tab */}
        {activeTab === 'affiliate' && dashboardData && (
          <div className="space-y-6">
            {/* Affiliate Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                label="Total Clicks"
                value={dashboardData.stats?.total_clicks || 0}
                color="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Signups"
                value={dashboardData.stats?.total_signups || 0}
                color="from-green-500 to-emerald-500"
              />
              <StatCard
                icon={CreditCard}
                label="Conversions"
                value={dashboardData.stats?.total_conversions || 0}
                color="from-purple-500 to-pink-500"
              />
              <StatCard
                icon={DollarSign}
                label="Total Earnings"
                value={`$${dashboardData.stats?.total_earnings?.toFixed(2) || '0.00'}`}
                color="from-pink-500 to-rose-500"
              />
            </div>

            {/* Affiliate Link */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Your Affiliate Link</h3>
              <div className="flex items-center gap-3">
                <Input
                  value={dashboardData.affiliate_link || ''}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={() => copyLink(dashboardData.affiliate_link)}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <Badge className="bg-pink-100 text-pink-700">
                  Code: {dashboardData.affiliate_code}
                </Badge>
                <Badge className="bg-green-100 text-green-700">
                  {dashboardData.commission_rate}% Commission
                </Badge>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">Pending Earnings</p>
                <p className="text-3xl font-bold text-yellow-600">
                  ${dashboardData.stats?.pending_earnings?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Awaiting payout</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">Total Earned</p>
                <p className="text-3xl font-bold text-green-600">
                  ${dashboardData.stats?.total_earnings?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Lifetime earnings</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">Paid Out</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${dashboardData.stats?.paid_earnings?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total withdrawn</p>
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Recent Referrals</h3>
              {dashboardData.recent_referrals?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recent_referrals.map((ref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500">{new Date(ref.date).toLocaleDateString()}</p>
                      </div>
                      <Badge className={
                        ref.status === 'completed' ? 'bg-green-100 text-green-700' :
                        ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {ref.status}
                      </Badge>
                      <p className="font-semibold text-green-600">+${ref.commission?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No referrals yet. Share your link to start earning!</p>
              )}
            </div>
          </div>
        )}

        {/* Referral Program Tab */}
        {activeTab === 'referral' && (
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    1
                  </div>
                  <h4 className="font-semibold mb-2">Share Your Link</h4>
                  <p className="text-gray-500 text-sm">Send your unique referral link to friends</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    2
                  </div>
                  <h4 className="font-semibold mb-2">They Sign Up</h4>
                  <p className="text-gray-500 text-sm">Friend creates account and subscribes</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    3
                  </div>
                  <h4 className="font-semibold mb-2">You Both Win!</h4>
                  <p className="text-gray-500 text-sm">You get $10 credit, they get 20% off</p>
                </div>
              </div>
            </div>

            {/* Your Link */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-4">Your Referral Link</h3>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1 bg-transparent border-none text-white"
                />
                <Button onClick={() => copyLink(referralLink)} className="bg-white text-green-600">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-white/20">Code: {referralInfo?.referral_code}</Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Referrals</span>
                    <span className="font-semibold">{referralInfo?.total_referrals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Successful Referrals</span>
                    <span className="font-semibold text-green-600">{referralInfo?.successful_referrals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending Rewards</span>
                    <span className="font-semibold text-yellow-600">${referralInfo?.pending_rewards?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-gray-500">Total Earned</span>
                    <span className="font-bold text-xl text-pink-600">${referralInfo?.total_rewards?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Rewards</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">You Get</p>
                    <p className="text-2xl font-bold text-green-700">$10 Credit</p>
                    <p className="text-xs text-green-500">Per successful referral</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Your Friend Gets</p>
                    <p className="text-2xl font-bold text-blue-700">20% Off</p>
                    <p className="text-xs text-blue-500">On their first month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default AffiliateDashboard;
