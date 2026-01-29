import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Check, ChevronRight, Star, Play } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const HeroSection = () => {
  const { hero, branding, loading } = useSiteSettings();
  
  const words = hero?.headline_animated_words || ['Audiences', 'Growth', 'Fans', 'Presence', 'Success'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  const trustBadges = hero?.trust_badges || [
    '2-Minute Setup',
    '100% Growth Guaranteed',
    'Rated 4.91/5'
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/50 via-white to-white">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Get Real Social Media
            <br />
            <span className="relative inline-block">
              <span
                className={`bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent transition-all duration-300 ${
                  isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                }`}
              >
                {words[currentWordIndex]}
              </span>
            </span>
          </h1>

          {/* Subheadline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
            Using Organic AI-Growth
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            No bots, no spam, no passwords. See real growth automatically using AI,
            social media experts and our patent-pending* technology.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 py-6 text-lg font-semibold group shadow-xl hover:shadow-2xl transition-all"
              >
                Start Growing
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                {index === 2 ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 font-medium">{badge}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 font-medium">{badge}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-t-2xl p-2 shadow-2xl">
              {/* Browser dots */}
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-700 rounded-full px-4 py-1 text-xs text-gray-400 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    adverlyx.com/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="p-6">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">A</span>
                      </div>
                      <span className="font-bold text-gray-900">Adverlyx</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Followers', value: '12,847', growth: '+234 today', color: 'pink' },
                      { label: 'Engagement', value: '4.8%', growth: '+0.6%', color: 'blue' },
                      { label: 'Reach', value: '45.2K', growth: '+12%', color: 'green' },
                      { label: 'Profile Visits', value: '892', growth: '+23%', color: 'purple' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-green-500">{stat.growth}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart placeholder */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-900">Growth Analytics</span>
                      <span className="text-sm text-gray-500">Last 7 days</span>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                      {[35, 45, 60, 75, 90, 85, 100].map((height, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-pink-500 to-orange-400 rounded-t-md transition-all hover:opacity-80"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -left-8 top-1/3 bg-white rounded-xl shadow-xl p-4 transform -rotate-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">+47 New Followers</p>
                  <p className="text-xs text-gray-500">in the last hour</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-8 top-1/2 bg-white rounded-xl shadow-xl p-4 transform rotate-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">AI Engine Active</p>
                  <p className="text-xs text-gray-500">Finding your audience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
