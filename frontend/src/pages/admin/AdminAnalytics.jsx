import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  TrendingUp, TrendingDown, Users, DollarSign, CreditCard, 
  Activity, Target, Zap, RefreshCw, Loader2, ArrowUpRight,
  ArrowDownRight, BarChart3, PieChart, Calendar, Clock,
  Globe, MapPin, Eye, UserPlus, Gift, ChevronRight
} from 'lucide-react';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [platformData, setPlatformData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [platform, trends, growth, geo, funnel] = await Promise.all([
        adminAPI.getPlatformAnalytics(period),
        adminAPI.getPlatformTrends(period === 'weekly' ? 7 : period === 'monthly' ? 30 : 90),
        adminAPI.getGrowthEngineAnalytics(),
        adminAPI.getGeographyAnalytics(),
        adminAPI.getConversionFunnel(period === 'weekly' ? 7 : period === 'monthly' ? 30 : 90)
      ]);
      setPlatformData(platform.data);
      setTrendsData(trends.data);
      setGrowthData(growth.data);
      setGeoData(geo.data);
      setFunnelData(funnel.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Platform performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
            data-testid="analytics-period-select"
          >
            <option value="daily">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">Last Year</option>
          </select>
          <Button onClick={loadAnalytics} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Monthly Recurring Revenue"
          value={`$${platformData?.revenue?.mrr?.toLocaleString() || 0}`}
          subtext={`$${platformData?.revenue?.arr?.toLocaleString() || 0} ARR`}
          icon={DollarSign}
          trend="+12%"
          trendUp={true}
          color="from-green-500 to-emerald-500"
          testId="mrr-metric"
        />
        <MetricCard 
          title="Total Users"
          value={platformData?.users?.total || 0}
          subtext={`${platformData?.users?.active || 0} active`}
          icon={Users}
          trend={`+${platformData?.users?.new || 0} new`}
          trendUp={true}
          color="from-blue-500 to-cyan-500"
          testId="users-metric"
        />
        <MetricCard 
          title="Active Subscriptions"
          value={platformData?.subscriptions?.active || 0}
          subtext={`${platformData?.subscriptions?.churn_rate || 0}% churn`}
          icon={CreditCard}
          trend={platformData?.subscriptions?.churn_rate > 5 ? "High churn" : "Healthy"}
          trendUp={platformData?.subscriptions?.churn_rate <= 5}
          color="from-purple-500 to-pink-500"
          testId="subs-metric"
        />
        <MetricCard 
          title="ARPU"
          value={`$${platformData?.revenue?.arpu?.toFixed(2) || 0}`}
          subtext={`$${platformData?.revenue?.arppu?.toFixed(2) || 0} ARPPU`}
          icon={Activity}
          trend="Avg per user"
          trendUp={true}
          color="from-orange-500 to-red-500"
          testId="arpu-metric"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          Conversion Funnel
        </h3>
        <ConversionFunnel data={funnelData} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-500" />
              Revenue Trend
            </h3>
          </div>
          <div className="h-64">
            <SimpleTrendChart data={trendsData?.trends || []} dataKey="revenue" color="#ec4899" />
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              User Growth
            </h3>
          </div>
          <div className="h-64">
            <SimpleTrendChart data={trendsData?.trends || []} dataKey="new_users" color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* Geographic Distribution & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Geographic Distribution
          </h3>
          <CountryDistribution data={geoData?.country_distribution || {}} />
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            Plan Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(platformData?.plan_distribution || {}).map(([plan, count]) => (
              <PlanBar 
                key={plan} 
                plan={plan} 
                count={count} 
                total={platformData?.subscriptions?.active || 1}
              />
            ))}
            {Object.keys(platformData?.plan_distribution || {}).length === 0 && (
              <p className="text-gray-500 text-center py-8">No subscription data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Growth Engine Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Growth Engine Performance
          </h3>
          <div className="space-y-4">
            <StatRow 
              label="Accounts Served" 
              value={growthData?.summary?.total_accounts_served || 0}
              icon={Target}
            />
            <StatRow 
              label="Total Followers Delivered" 
              value={(growthData?.summary?.total_followers_delivered || 0).toLocaleString()}
              icon={Users}
            />
            <StatRow 
              label="Avg Followers/Account" 
              value={(growthData?.summary?.average_followers_per_account || 0).toFixed(0)}
              icon={TrendingUp}
            />
          </div>
          
          {growthData?.niche_distribution && Object.keys(growthData.niche_distribution).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-700 mb-3">Top Niches</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(growthData.niche_distribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([niche, count]) => (
                    <Badge key={niche} variant="secondary" className="capitalize">
                      {niche}: {count}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversion Rates Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Conversion Rates
          </h3>
          <div className="space-y-6">
            <ConversionRate 
              label="Visitor → Signup"
              rate={funnelData?.conversion_rates?.visitor_to_signup || 0}
              color="blue"
            />
            <ConversionRate 
              label="Signup → Trial"
              rate={funnelData?.conversion_rates?.signup_to_trial || 0}
              color="purple"
            />
            <ConversionRate 
              label="Trial → Paid"
              rate={funnelData?.conversion_rates?.trial_to_paid || 0}
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          Daily Breakdown ({period})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">New Users</th>
                <th className="pb-3 font-medium">New Subscriptions</th>
                <th className="pb-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(trendsData?.trends || []).slice(-10).reverse().map((day, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 text-gray-900">{day.date}</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1">
                      {day.new_users}
                      {day.new_users > 0 && <ArrowUpRight className="w-3 h-3 text-green-500" />}
                    </span>
                  </td>
                  <td className="py-3">{day.new_subscriptions}</td>
                  <td className="py-3 font-medium">${day.revenue?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
              {(!trendsData?.trends || trendsData.trends.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtext, icon: Icon, trend, trendUp, color, testId }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm" data-testid={testId}>
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {trend}
      </div>
    </div>
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-400 mt-1">{subtext}</p>
  </div>
);

// Conversion Funnel Component
const ConversionFunnel = ({ data }) => {
  const stages = data?.funnel || [
    { stage: 'Visitors', count: 1000, icon: 'eye' },
    { stage: 'Signups', count: 0, icon: 'user-plus' },
    { stage: 'Free Trial', count: 0, icon: 'gift' },
    { stage: 'Paid', count: 0, icon: 'credit-card' }
  ];

  const maxCount = Math.max(...stages.map(s => s.count), 1);
  const icons = { eye: Eye, 'user-plus': UserPlus, gift: Gift, 'credit-card': CreditCard };

  return (
    <div className="flex items-center justify-between gap-2">
      {stages.map((stage, idx) => {
        const Icon = icons[stage.icon] || Eye;
        const width = Math.max((stage.count / maxCount) * 100, 20);
        
        return (
          <React.Fragment key={stage.stage}>
            <div className="flex-1 text-center">
              <div 
                className="mx-auto mb-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center transition-all"
                style={{ width: `${width}%`, minWidth: '60px', height: '60px' }}
              >
                <Icon className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stage.count.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{stage.stage}</p>
            </div>
            {idx < stages.length - 1 && (
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Country Distribution Component
const CountryDistribution = ({ data }) => {
  const countries = Object.entries(data).slice(0, 8);
  const total = countries.reduce((sum, [_, count]) => sum + count, 0) || 1;
  
  const colors = [
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-yellow-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-cyan-500',
    'from-red-500 to-pink-500'
  ];

  if (countries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No geographic data available</p>
        <p className="text-sm">Data will appear as users set their targeting</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {countries.map(([country, count], idx) => (
        <div key={country} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center`}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-gray-900">{country}</span>
              <span className="text-sm text-gray-500">{count} ({((count / total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Conversion Rate Component
const ConversionRate = ({ label, rate, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500'
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{rate}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Simple Trend Chart (CSS-based)
const SimpleTrendChart = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  const values = data.map(d => d[dataKey] || 0);
  const maxValue = Math.max(...values, 1);
  
  return (
    <div className="h-full flex items-end gap-1">
      {data.slice(-30).map((item, idx) => {
        const height = ((item[dataKey] || 0) / maxValue) * 100;
        return (
          <div 
            key={idx}
            className="flex-1 rounded-t transition-all hover:opacity-80 group relative"
            style={{ 
              height: `${Math.max(height, 2)}%`,
              backgroundColor: color
            }}
          >
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
              {item.date}: {dataKey === 'revenue' ? `$${item[dataKey]?.toFixed(2)}` : item[dataKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Plan Distribution Bar
const PlanBar = ({ plan, count, total }) => {
  const percentage = (count / total) * 100;
  const colors = {
    basic: 'from-gray-400 to-gray-500',
    pro: 'from-pink-500 to-purple-500',
    enterprise: 'from-yellow-500 to-orange-500'
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium capitalize">{plan}</span>
        <span className="text-sm text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colors[plan] || 'from-gray-400 to-gray-500'} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Stat Row Component
const StatRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-gray-400" />
      <span className="text-gray-600">{label}</span>
    </div>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export default AdminAnalytics;
