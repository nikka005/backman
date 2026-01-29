import React from 'react';
import { Button } from '../ui/button';
import { Check, Briefcase, Scale, TrendingUp, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const BenefitsSection = () => {
  const benefits = [
    'Massive Following',
    'Work-Life Balance',
    'Influencer-Level Reach',
    'Ultimate Freedom & Flexibility',
    'Lucrative Brand Deals',
    'And So Much More...'
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Having trouble growing on Instagram?
              <span className="block text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">
                Adverlyx is the game-changing solution you need!
              </span>
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Imagine waking up every day excited about what you do. Enjoy the freedom 
              to work from anywhere, on your own schedule. A massive and engaged Instagram 
              audience makes that possible.
            </p>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              With Adverlyx, you gain the influence to sell, grow a powerful following, 
              and showcase your profile, business, or brand to millions. These are just 
              a few of the opportunities Adverlyx offers, and our team is here to guide 
              you every step of the way toward your goals.
            </p>

            {/* Benefits List */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <Link to="/signup">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8">
                Start Growing Today
              </Button>
            </Link>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            <div className="relative">
              {/* Main card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Growth Results</h3>
                    <p className="text-gray-500">Average monthly gain</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-pink-600" />
                      </div>
                      <span className="font-medium text-gray-700">Business Accounts</span>
                    </div>
                    <span className="text-xl font-bold text-green-500">+3,500</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-700">Influencers</span>
                    </div>
                    <span className="text-xl font-bold text-green-500">+5,200</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-medium text-gray-700">Personal Brands</span>
                    </div>
                    <span className="text-xl font-bold text-green-500">+2,800</span>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">AI Powered</span>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-lg p-3 text-white flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="text-sm font-semibold">100% Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
