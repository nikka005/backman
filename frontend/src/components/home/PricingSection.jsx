import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Link } from 'react-router-dom';

// Fallback plans if API fails
const fallbackPlans = [
  {
    id: 'basic',
    name: 'Basic',
    slug: 'basic',
    description: 'A great way to start growing your account organically.',
    monthly_price: 49,
    yearly_price: 29,
    followers_min: 1000,
    followers_max: 1500,
    features: ['Guaranteed follower increase', 'Instant Results', 'Targeted Followers', 'Team Support', 'Analytics Dashboard'],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    description: 'The best way to grow quickly with advanced targeting.',
    monthly_price: 69,
    yearly_price: 41,
    followers_min: 2500,
    followers_max: 3500,
    features: ['Everything in Basic', 'AI-Powered Growth', 'Priority Support', 'Advanced Analytics', 'Adverlyx Cloud™'],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Custom solutions for agencies and large brands.',
    monthly_price: 149,
    yearly_price: 99,
    followers_min: 5000,
    followers_max: 10000,
    features: ['Everything in Pro', 'Dedicated Manager', 'Custom Strategy', '24/7 Support', 'API Access'],
    popular: false
  }
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/public/plans');
      if (response.data && response.data.length > 0) {
        // Sort plans by price
        const sortedPlans = response.data.sort((a, b) => 
          (a.monthly_price || 0) - (b.monthly_price || 0)
        );
        setPlans(sortedPlans);
      } else {
        setPlans(fallbackPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowers = (plan) => {
    if (plan.followers_min && plan.followers_max) {
      return `${plan.followers_min.toLocaleString()} - ${plan.followers_max.toLocaleString()}`;
    }
    if (plan.followers_min) {
      return `${plan.followers_min.toLocaleString()}+`;
    }
    return '1,000+';
  };

  const getFeatures = (plan) => {
    // Check feature_list first (from database), then features array
    if (plan.feature_list && Array.isArray(plan.feature_list) && plan.feature_list.length > 0) {
      return plan.feature_list;
    }
    if (plan.features && Array.isArray(plan.features) && plan.features.length > 0) {
      return plan.features;
    }
    // Default features based on plan type
    const defaultFeatures = {
      basic: ['Guaranteed follower increase', 'Instant Results From Day 1', 'Targeted, Organic Followers', 'LA & London Team Support', 'Real-Time Analytics Dashboard'],
      pro: ['Guaranteed follower increase', 'Instant Results From Day 1', 'Targeted, Organic Followers', 'LA & London Team Support', 'Real-Time Analytics Dashboard', 'AI-Powered Growth Engine', 'Adverlyx Cloud™'],
      enterprise: ['Everything in Pro', 'Dedicated Account Manager', 'Custom Growth Strategy', 'Priority Support 24/7', 'White-label Reporting', 'API Access', 'Multiple Accounts']
    };
    return defaultFeatures[plan.slug] || defaultFeatures.basic;
  };

  if (loading) {
    return (
      <section id="pricing" className="py-20 bg-white">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full text-sm font-medium text-pink-700 mb-4">
            <Sparkles className="w-4 h-4" />
            Adverlyx Is For You
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            <span className="text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">10x Faster</span>
            {' '}Social Media Growth.
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Guaranteed growth or it's on us! 250+ hours saved every month.
          </p>
          <Badge className="bg-red-100 text-red-700 font-semibold">
            🎉 New Year Sale - Limited Time ⏳
          </Badge>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-pink-500"
          />
          <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge className="bg-green-100 text-green-700">
              Save 50%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPro = plan.is_popular || plan.slug === 'pro' || plan.name?.toLowerCase() === 'pro' || plan.popular;
            const monthlyPrice = plan.monthly_price || plan.monthlyPrice || 49;
            const yearlyPrice = plan.yearly_price || plan.yearlyPrice || 29;
            const features = getFeatures(plan);
            
            return (
              <div
                key={plan.id || plan.slug}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
                  isPro
                    ? 'border-pink-500 shadow-xl shadow-pink-100 scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {/* Popular badge */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name} Plan</h3>
                  <p className="text-sm text-gray-500 mb-4 h-12">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${isYearly ? yearlyPrice : monthlyPrice}
                      </span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-gray-400 line-through">
                        ${monthlyPrice}/mo
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {isYearly ? 'Billed Yearly' : 'Billed Monthly'}
                    </p>
                  </div>

                  {/* Followers guarantee */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600">Guaranteed</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatFollowers(plan)} Followers/mo
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Link to={`/checkout?plan=${plan.slug || plan.id}&billing=${isYearly ? 'yearly' : 'monthly'}`}>
                    <Button
                      className={`w-full rounded-full mb-6 group ${
                        isPro
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      Get Started
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
