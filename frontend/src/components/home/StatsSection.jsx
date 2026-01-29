import React from 'react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { Users, Heart, Clock, Star } from 'lucide-react';

const StatsSection = () => {
  const { stats: siteStats } = useSiteSettings();
  
  const stats = [
    { label: 'Happy Users', value: siteStats?.happy_users || '55,000+' },
    { label: 'New Fans Monthly', value: siteStats?.new_fans_monthly || '~4,500' },
    { label: 'Hours Saved', value: siteStats?.hours_saved || '7M+' },
    { label: 'Satisfaction Score', value: siteStats?.satisfaction_score || '9.8/10' },
  ];
  
  const icons = [Users, Heart, Clock, Star];
  const gradients = [
    'from-orange-500 to-pink-500',
    'from-pink-500 to-purple-500',
    'from-purple-500 to-blue-500',
    'from-blue-500 to-cyan-500'
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Trusted and used for organic social media growth
          </h2>
          <p className="text-lg text-gray-600">
            by leading brands, businesses, and influencers
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = icons[index];
            return (
              <div
                key={stat.label}
                className="relative group"
              >
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Icon */}
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${gradients[index]} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Value */}
                  <div className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${gradients[index]} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <p className="text-gray-600 font-medium">
                    {stat.label}
                  </p>
                </div>
                
                {/* Decorative gradient blob */}
                <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${gradients[index]} opacity-0 group-hover:opacity-10 blur-xl rounded-2xl transition-opacity`}></div>
              </div>
            );
          })}
        </div>

        {/* Brand Logos */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-60">
          {['Dior', 'Unilever', 'Ogilvy', 'GroupM', 'Traackr'].map((brand) => (
            <div
              key={brand}
              className="px-6 py-3 bg-gray-100 rounded-lg"
            >
              <span className="text-lg font-semibold text-gray-500">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
