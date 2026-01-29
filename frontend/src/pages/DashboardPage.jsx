import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Users, TrendingUp, Eye, Heart, Settings, LogOut, Bell, Search,
  ChevronRight, ArrowUpRight, ArrowDownRight, Instagram, Target,
  Pause, Play, Calendar, BarChart3, Zap, Crown, MessageCircle
} from 'lucide-react';
import { dashboardStats, growthData } from '../data/mockData';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [isGrowthActive, setIsGrowthActive] = useState(true);
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const stats = [
    {
      label: 'Total Followers',
      value: dashboardStats.followers.toLocaleString(),
      change: `+${dashboardStats.followersGrowth} today`,
      trend: 'up',
      icon: Users,
      color: 'from-pink-500 to-rose-500'
    },
    {
      label: 'Engagement Rate',
      value: `${dashboardStats.engagement}%`,
      change: `+${dashboardStats.engagementGrowth}%`,
      trend: 'up',
      icon: Heart,
      color: 'from-orange-500 to-pink-500'
    },
    {
      label: 'Profile Reach',
      value: `${(dashboardStats.reach / 1000).toFixed(1)}K`,
      change: `+${dashboardStats.reachGrowth}%`,
      trend: 'up',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Profile Visits',
      value: dashboardStats.profileVisits.toLocaleString(),
      change: `+${dashboardStats.profileVisitsGrowth}%`,
      trend: 'up',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const targetSettings = [
    { label: 'Niche', value: 'Fashion & Lifestyle' },
    { label: 'Location', value: 'United States, UK' },
    { label: 'Interests', value: 'Fashion, Travel, Beauty' },
    { label: 'Competitors', value: '@fashionnova, @zara' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Adverlyx</span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 font-medium">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <Target className="w-5 h-5" />
            Targeting
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-5 h-5" />
            Analytics
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-5 h-5" />
            Support
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-900">Pro Plan</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Upgrade to unlock more features</p>
            <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm">
              Upgrade Now
            </Button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                </Link>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome back, {userName}!</h1>
                <p className="text-sm text-gray-500">Here's your growth overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Growth Status Card */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Instagram className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">@yourusername</h2>
                  <p className="text-gray-400 text-sm">Connected Account</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isGrowthActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-white text-sm">
                    {isGrowthActive ? 'AI Growth Engine Active' : 'Growth Paused'}
                  </span>
                </div>
                <Button
                  onClick={() => setIsGrowthActive(!isGrowthActive)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 rounded-full"
                >
                  {isGrowthActive ? (
                    <><Pause className="w-4 h-4 mr-2" /> Pause</>  
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Resume</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4" />
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Growth Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Growth Analytics</h3>
                  <p className="text-sm text-gray-500">Followers gained this week</p>
                </div>
                <Badge className="bg-green-100 text-green-700">+2,180 this week</Badge>
              </div>
              <div className="h-64 flex items-end gap-2">
                {growthData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-pink-500 to-orange-400 rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${(data.followers / 520) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500">{data.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Settings */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Target Settings</h3>
                <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                  Edit
                </Button>
              </div>
              <div className="space-y-4">
                {targetSettings.map((setting) => (
                  <div key={setting.label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500">{setting.label}</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[150px]">{setting.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-gray-900">AI Optimization</span>
                </div>
                <p className="text-sm text-gray-600">Our AI is continuously optimizing your targeting for best results.</p>
              </div>
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monthly Growth Progress</h3>
                <p className="text-sm text-gray-500">Your guaranteed followers this month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">2,847 / 3,500</p>
                <p className="text-sm text-gray-500">followers gained</p>
              </div>
            </div>
            <Progress value={81} className="h-3" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">81% complete</span>
              <span className="text-sm text-green-600 font-medium">On track to exceed goal!</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
