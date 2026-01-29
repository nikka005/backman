import React from 'react';
import { Button } from '../ui/button';
import { Shield, Zap, Brain, Lock, ChevronRight, Sparkles } from 'lucide-react';

const SecretSauceSection = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI & Machine Learning',
      description: 'Our proprietary algorithms learn and adapt to your niche'
    },
    {
      icon: Zap,
      title: 'Nano-Interactions',
      description: 'Subtle engagement patterns that feel organic and natural'
    },
    {
      icon: Shield,
      title: 'Account Safety',
      description: 'Never at risk of getting banned or flagged'
    },
    {
      icon: Lock,
      title: 'No Passwords Needed',
      description: 'We never ask for or store your credentials'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExLDEgMCAxLDEgMiwwYTEsMSAwIDAsMSAtMiwwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-white/80 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Our Secret Sauce
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Patent-pending growth technology*
            </h2>
            
            <p className="text-xl font-semibold text-transparent bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text mb-6">
              No spam. No bots. No illegal tactics.
            </p>
            
            <p className="text-gray-400 mb-8 leading-relaxed">
              We've developed our growth engine by training ML & deep learning models. 
              Our secret sauce is a combination of paid advertising, nano-interactions, 
              niche data clusters and real-human activity.
            </p>
            
            <p className="text-gray-400 mb-8 leading-relaxed">
              Compared to other growth services, we attract more real, organic users 
              interested in your account, without ever putting your account at any risk 
              of getting banned or flagged.
            </p>
            
            <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 group">
              Get Started
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Content - Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecretSauceSection;
