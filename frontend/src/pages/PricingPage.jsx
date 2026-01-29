import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { publicAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Check, ChevronRight, Sparkles, HelpCircle, Loader2 } from 'lucide-react';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(true);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await publicAPI.getPlans();
      // Transform API response to match expected format
      const transformedPlans = response.data.map(plan => ({
        id: plan.id || plan.slug,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthly_price,
        yearlyPrice: plan.yearly_price,
        followers: `${(plan.followers_min / 1000).toFixed(0)}K - ${(plan.followers_max / 1000).toFixed(0)}K`,
        features: plan.feature_list || plan.features || [],
        popular: plan.is_popular || plan.popular
      }));
      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      // Fallback to default plans
      setPlans([
        {
          id: 'basic',
          name: 'Basic',
          description: 'A great way to start growing your account organically.',
          monthlyPrice: 49,
          yearlyPrice: 29,
          followers: '1K - 1.5K',
          features: ['Guaranteed follower increase', 'Targeted, Organic Followers', 'Real-Time Analytics'],
          popular: false
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'The best way to grow quickly with advanced targeting.',
          monthlyPrice: 69,
          yearlyPrice: 41,
          followers: '2.5K - 3.5K',
          features: ['Everything in Basic', 'AI-Powered Growth Engine', 'Priority Support'],
          popular: true
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Custom solutions for agencies and large brands.',
          monthlyPrice: 149,
          yearlyPrice: 99,
          followers: '5K+',
          features: ['Everything in Pro', 'Dedicated Account Manager', 'Custom Growth Strategy'],
          popular: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load feature matrix dynamically
  const [featureMatrix, setFeatureMatrix] = useState([]);
  
  useEffect(() => {
    loadFeatureMatrix();
  }, []);

  const loadFeatureMatrix = async () => {
    try {
      const response = await publicAPI.getFeatureMatrix();
      setFeatureMatrix(response.data);
    } catch (error) {
      console.error('Error loading feature matrix:', error);
    }
  };

  const handleSelectPlan = async (plan) => {
    // If not authenticated, redirect to signup
    if (!isAuthenticated) {
      navigate('/signup', { state: { selectedPlan: plan.slug } });
      return;
    }

    setProcessingPlan(plan.slug);

    try {
      const packageId = `${plan.slug}_${isYearly ? 'yearly' : 'monthly'}`;
      const originUrl = window.location.origin;
      
      const response = await paymentAPI.createCheckoutSession(packageId, originUrl);
      
      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  // Transform feature matrix to comparison format
  const comparisonFeatures = featureMatrix.length > 0 ? featureMatrix.map(f => ({
    name: f.feature_name,
    basic: f.is_boolean ? (f.basic_value === 'Yes') : f.basic_value,
    pro: f.is_boolean ? (f.pro_value === 'Yes') : f.pro_value,
    enterprise: f.is_boolean ? (f.enterprise_value === 'Yes') : f.enterprise_value,
  })) : [
    { name: 'Guaranteed Followers/Month', basic: '1,000 - 1,500', pro: '2,500 - 3,500+', enterprise: '5,000+' },
    { name: 'AI-Powered Targeting', basic: true, pro: true, enterprise: true },
    { name: 'Real-Time Analytics', basic: true, pro: true, enterprise: true },
    { name: 'Organic Growth Only', basic: true, pro: true, enterprise: true },
    { name: 'Account Safety Guarantee', basic: true, pro: true, enterprise: true },
    { name: 'AI Growth Engine', basic: false, pro: true, enterprise: true },
    { name: 'Adverlyx Cloud™', basic: false, pro: true, enterprise: true },
    { name: 'Priority Support', basic: false, pro: true, enterprise: true },
    { name: 'Dedicated Account Manager', basic: false, pro: false, enterprise: true },
    { name: 'Custom Growth Strategy', basic: false, pro: false, enterprise: true },
    { name: 'API Access', basic: false, pro: false, enterprise: true },
    { name: 'Multiple Accounts', basic: false, pro: false, enterprise: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-orange-50/50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full text-sm font-medium text-pink-700 mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Choose Your <span className="text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">Growth Plan</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Guaranteed growth or it's on us. Start with any plan and upgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
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
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
                      plan.popular
                        ? 'border-pink-500 shadow-xl shadow-pink-100 scale-105 z-10'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                    data-testid={`pricing-card-${plan.id}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-500 mb-6 h-12">{plan.description}</p>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold text-gray-900">
                            ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                          </span>
                          <span className="text-gray-500">/mo</span>
                        </div>
                        {isYearly && (
                          <p className="text-sm text-gray-400 line-through mt-1">
                            ${plan.monthlyPrice}/mo
                          </p>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-600">Guaranteed</p>
                        <p className="text-xl font-bold text-green-700">
                          {plan.followers} Followers/mo
                        </p>
                      </div>

                      <Link to="/signup">
                        <Button
                          className={`w-full rounded-full py-6 mb-6 group ${
                            plan.popular
                              ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                          data-testid={`get-started-${plan.id}`}
                        >
                          Get Started
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>

                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Compare Plans
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">Basic</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-pink-50">Pro</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-0">
                        <td className="py-4 px-6 text-gray-700">{feature.name}</td>
                        <td className="py-4 px-6 text-center">
                          {typeof feature.basic === 'boolean' ? (
                            feature.basic ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )
                          ) : (
                            <span className="font-medium text-gray-900">{feature.basic}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center bg-pink-50/50">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )
                          ) : (
                            <span className="font-medium text-gray-900">{feature.pro}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )
                          ) : (
                            <span className="font-medium text-gray-900">{feature.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <HelpCircle className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Check out our FAQ or contact our support team for help.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/faq">
                <Button variant="outline" className="rounded-full px-6">
                  View FAQ
                </Button>
              </Link>
              <Link to="/contact">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
