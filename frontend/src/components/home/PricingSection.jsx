import React, { useState } from 'react';
import { pricingPlans } from '../../data/mockData';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Sparkles, ChevronRight } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(true);

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
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
                plan.popular
                  ? 'border-pink-500 shadow-xl shadow-pink-100 scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
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
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-gray-400 line-through">
                      ${plan.monthlyPrice}/mo
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
                    {plan.followers} Followers/mo
                  </p>
                </div>

                {/* CTA Button */}
                <Link to="/signup">
                  <Button
                    className={`w-full rounded-full mb-6 group ${
                      plan.popular
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
                  {plan.features.map((feature, index) => (
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
