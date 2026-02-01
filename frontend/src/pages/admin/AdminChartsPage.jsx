import React, { useState, useEffect } from 'react';
import { adminChartsAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  RefreshCw, Loader2, TrendingUp, TrendingDown, Users, DollarSign,
  Eye, Globe, BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Clock, Target, MousePointer
} from 'lucide-react';

const AdminChartsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [revenueData, setRevenueData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [trafficSources, setTrafficSources] = useState(null);
  const [topPages, setTopPages] = useState([]);
  const [funnelData, setFunnelData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [realtime, setRealtime] = useState(null);

  useEffect(() => {
    loadAllData();
  }, [period]);

  useEffect(() => {
    // Refresh realtime data every 30 seconds
    const interval = setInterval(loadRealtime, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [revenue, users, traffic, sources, pages, funnel, geo, rt] = await Promise.all([
        adminChartsAPI.getRevenue(period),
        adminChartsAPI.getUsers(period),
        adminChartsAPI.getTraffic(period),
        adminChartsAPI.getTrafficSources(),
        adminChartsAPI.getTopPages(10),
        adminChartsAPI.getConversionFunnel(period),
        adminChartsAPI.getGeographic(),
        adminChartsAPI.getRealtime()
      ]);
      setRevenueData(revenue.data);
      setUsersData(users.data);
      setTrafficData(traffic.data);
      setTrafficSources(sources.data.sources);
      setTopPages(pages.data.pages);
      setFunnelData(funnel.data);
      setGeoData(geo.data);
      setRealtime(rt.data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtime = async () => {
    try {
      const res = await adminChartsAPI.getRealtime();
      setRealtime(res.data);
    } catch (error) {
      console.error('Error loading realtime:', error);
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
    <div data-testid="admin-charts-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Charts</h1>
          <p className="text-gray-500">Visual insights and traffic statistics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <Button onClick={loadAllData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Realtime Stats */}
      {realtime && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">Real-time Stats</h3>
            <Badge className="bg-white/20 text-white text-xs ml-auto">Live</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-indigo-200 text-sm">Current Visitors</p>
              <p className="text-3xl font-bold">{realtime.current_visitors}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Active Users (1h)</p>
              <p className="text-3xl font-bold">{realtime.active_users}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Recent Signups</p>
              <p className="text-3xl font-bold">{realtime.recent_signups}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Page Views (1h)</p>
              <p className="text-3xl font-bold">{realtime.page_views_last_hour}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Revenue (1h)</p>
              <p className="text-3xl font-bold">${realtime.recent_revenue?.toFixed(0) || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Revenue"
          value={`$${revenueData?.summary?.total?.toLocaleString() || 0}`}
          subtitle={`$${revenueData?.summary?.average_daily?.toFixed(0) || 0}/day avg`}
          trend={revenueData?.summary?.growth_percent || 0}
          icon={DollarSign}
          color="from-green-500 to-emerald-500"
        />
        <SummaryCard
          title="Total Users"
          value={usersData?.summary?.total_users?.toLocaleString() || 0}
          subtitle={`+${usersData?.summary?.new_users_period || 0} this period`}
          trend={10}
          icon={Users}
          color="from-blue-500 to-cyan-500"
        />
        <SummaryCard
          title="Page Views"
          value={trafficData?.summary?.total_page_views?.toLocaleString() || 0}
          subtitle={`${trafficData?.summary?.total_unique_visitors?.toLocaleString() || 0} unique`}
          trend={5}
          icon={Eye}
          color="from-purple-500 to-pink-500"
        />
        <SummaryCard
          title="Bounce Rate"
          value={`${trafficData?.summary?.average_bounce_rate || 0}%`}
          subtitle={`${trafficData?.summary?.average_session_duration || 0}min avg session`}
          trend={-3}
          icon={Target}
          color="from-orange-500 to-red-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Revenue Trend
            </h3>
            <Badge className="bg-green-100 text-green-700">
              {revenueData?.summary?.growth_percent > 0 ? '+' : ''}{revenueData?.summary?.growth_percent?.toFixed(1) || 0}%
            </Badge>
          </div>
          <div className="h-64">
            <BarChart data={revenueData?.chart_data || []} dataKey="revenue" color="#10b981" />
          </div>
        </div>

        {/* Users Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              User Growth
            </h3>
          </div>
          <div className="h-64">
            <LineChart data={usersData?.chart_data || []} dataKey="cumulative" color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Traffic Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Website Traffic
            </h3>
          </div>
          <div className="h-64">
            <AreaChart data={trafficData?.chart_data || []} />
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-pink-500" />
            Traffic Sources
          </h3>
          <div className="space-y-4">
            {trafficSources && Object.entries(trafficSources).map(([key, source]) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{source.label}</span>
                    <span className="text-gray-500">{source.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${source.value}%`, backgroundColor: source.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          Conversion Funnel
        </h3>
        <div className="flex items-center justify-between gap-4">
          {funnelData?.funnel?.map((stage, idx) => (
            <React.Fragment key={stage.stage}>
              <div className="flex-1 text-center">
                <div 
                  className="mx-auto mb-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center"
                  style={{ 
                    width: `${Math.max(60, stage.percentage)}%`, 
                    minWidth: '80px',
                    height: '80px' 
                  }}
                >
                  <span className="text-2xl font-bold text-pink-600">{stage.percentage}%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stage.count.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{stage.stage}</p>
              </div>
              {idx < funnelData.funnel.length - 1 && (
                <div className="text-gray-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Conversion Rates */}
        <div className="mt-6 pt-6 border-t grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Visitor → Signup</p>
            <p className="text-xl font-bold text-blue-600">{funnelData?.conversion_rates?.visitor_to_signup || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Signup → Trial</p>
            <p className="text-xl font-bold text-purple-600">{funnelData?.conversion_rates?.signup_to_trial || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Trial → Paid</p>
            <p className="text-xl font-bold text-green-600">{funnelData?.conversion_rates?.trial_to_paid || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Overall</p>
            <p className="text-xl font-bold text-pink-600">{funnelData?.conversion_rates?.overall || 0}%</p>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-blue-500" />
            Top Pages
          </h3>
          <div className="space-y-3">
            {topPages.map((page, idx) => (
              <div key={page.path} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{page.title}</p>
                  <p className="text-xs text-gray-400">{page.path}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{page.views.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{page.bounce_rate}% bounce</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Geographic Distribution
          </h3>
          <div className="space-y-3">
            {geoData?.countries?.map((country, idx) => {
              const total = geoData.countries.reduce((sum, c) => sum + c.users, 0);
              const percentage = ((country.users / total) * 100).toFixed(1);
              return (
                <div key={country.name} className="flex items-center gap-3">
                  <span className="text-2xl">{getCountryFlag(country.name)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{country.name}</span>
                      <span className="text-gray-500">{country.users} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, subtitle, trend, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(trend).toFixed(1)}%
      </div>
    </div>
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
  </div>
);

// Bar Chart Component
const BarChart = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No data</div>;
  
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0), 1);
  
  return (
    <div className="h-full flex items-end gap-1">
      {data.map((item, idx) => {
        const height = ((item[dataKey] || 0) / maxValue) * 100;
        return (
          <div
            key={idx}
            className="flex-1 rounded-t transition-all hover:opacity-80 relative group"
            style={{ height: `${Math.max(height, 2)}%`, backgroundColor: color }}
          >
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
              {item.date}: ${item[dataKey]?.toFixed(2) || 0}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Line Chart Component
const LineChart = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No data</div>;
  
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0), 1);
  const points = data.map((item, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - ((item[dataKey] || 0) / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="h-full relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={`0,100 ${points} 100,100`}
          fill={`${color}20`}
          stroke="none"
        />
      </svg>
    </div>
  );
};

// Area Chart Component
const AreaChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No data</div>;
  
  const maxValue = Math.max(...data.map(d => d.page_views || 0), 1);
  
  return (
    <div className="h-full flex items-end gap-1">
      {data.map((item, idx) => {
        const height = ((item.page_views || 0) / maxValue) * 100;
        return (
          <div key={idx} className="flex-1 relative group">
            <div
              className="w-full rounded-t bg-gradient-to-t from-purple-500 to-pink-400 transition-all hover:opacity-80"
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
              {item.date}: {item.page_views?.toLocaleString() || 0} views
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Country flag helper
const getCountryFlag = (country) => {
  const flags = {
    'United States': '🇺🇸',
    'India': '🇮🇳',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'France': '🇫🇷',
    'Brazil': '🇧🇷',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹'
  };
  return flags[country] || '🌍';
};

export default AdminChartsPage;
