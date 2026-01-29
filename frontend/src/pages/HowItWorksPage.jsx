import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { howItWorks } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Target, Search, TrendingUp, ChevronRight, Shield, Zap, Brain, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorksPage = () => {
  const icons = { Target, Search, TrendingUp };

  const detailedSteps = [
    {
      step: 1,
      title: 'Connect Your Account',
      subtitle: 'Safe & Secure Setup',
      description: 'Simply enter your Instagram username - no password required. Our platform uses safe, Instagram-compliant methods.',
      details: [
        'No password or login credentials needed',
        '2-minute simple setup process',
        'Fully compliant with Instagram ToS',
        'Your account stays 100% secure'
      ],
      icon: Shield,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: 2,
      title: 'Define Your Audience',
      subtitle: 'AI-Powered Targeting',
      description: 'Tell us who your ideal followers are. Our AI analyzes millions of profiles to find your perfect audience.',
      details: [
        'Target by location, interests, hashtags',
        'Competitor audience targeting',
        'Demographic filters (age, gender)',
        'Niche-specific recommendations'
      ],
      icon: Brain,
      color: 'from-purple-500 to-pink-500'
    },
    {
      step: 3,
      title: 'Watch The Magic Happen',
      subtitle: 'Organic Growth Engine',
      description: 'Our AI promotes your content to your target audience through organic engagement and micro-interactions.',
      details: [
        'Real, engaged followers',
        'Gradual, natural growth pattern',
        'No bots or fake accounts',
        'Results from Day 1'
      ],
      icon: Zap,
      color: 'from-orange-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              How <span className="text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">Adverlyx</span> Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Our AI-powered platform helps you grow your Instagram organically in just 3 simple steps. 
              No bots, no spam, no risk.
            </p>
            <Link to="/signup">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-6 text-lg">
                Start Growing Now
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Detailed Steps */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-24">
              {detailedSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                  >
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${step.color} text-white text-sm font-medium mb-4`}>
                        Step {step.step}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h2>
                      <p className="text-lg text-gray-500 mb-4">{step.subtitle}</p>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      <div className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-gray-700">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <div className={`w-full aspect-square max-w-md mx-auto bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center p-12 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/10"></div>
                        <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                          <Icon className="w-24 h-24 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Growing?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join 55,000+ users who have transformed their Instagram presence
            </p>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full px-10 py-6 text-lg">
                Get Started - It's Free
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
