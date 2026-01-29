import React from 'react';
import { howItWorks } from '../../data/mockData';
import { Button } from '../ui/button';
import { Target, Search, TrendingUp, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HowItWorksSection = () => {
  const icons = { Target, Search, TrendingUp };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-2">
            3 Simple Steps
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-200 via-pink-200 to-purple-200 -translate-y-1/2"></div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {howItWorks.map((step, index) => {
              const Icon = icons[step.icon];
              return (
                <div
                  key={step.step}
                  className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Step number */}
                  <div className="absolute -top-4 left-8 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                    Step {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mt-4">
                    <Icon className="w-8 h-8 text-pink-600" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Arrow for desktop */}
                  {index < 2 && (
                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md items-center justify-center z-10">
                      <ArrowRight className="w-4 h-4 text-pink-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/signup">
            <Button
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 group"
            >
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
