import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { publicAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  CreditCard, Check, ChevronLeft, Tag, Shield, Lock, 
  Loader2, Globe, Percent, CheckCircle, AlertCircle,
  Sparkles, Crown
} from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Get plan and billing cycle from URL params
  const planSlug = searchParams.get('plan');
  const billingCycle = searchParams.get('billing') || 'yearly';
  const fromAI = searchParams.get('from') === 'ai';
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [userCountry, setUserCountry] = useState('US');
  
  // Load plan details
  useEffect(() => {
    if (!planSlug) {
      navigate('/pricing');
      return;
    }
    
    // Wait for auth check to complete
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    
    loadPlanDetails();
    detectUserCountry();
  }, [planSlug, isAuthenticated, authLoading, navigate]);
  
  const loadPlanDetails = async () => {
    try {
      const response = await publicAPI.getPlans();
      const foundPlan = response.data.find(p => 
        p.slug?.toLowerCase() === planSlug?.toLowerCase() || 
        p.id?.toLowerCase() === planSlug?.toLowerCase()
      );
      
      if (foundPlan) {
        setPlan({
          id: foundPlan.id || foundPlan.slug,
          slug: foundPlan.slug,
          name: foundPlan.name,
          description: foundPlan.description,
          monthlyPrice: foundPlan.monthly_price,
          yearlyPrice: foundPlan.yearly_price,
          followers: `${(foundPlan.followers_min / 1000).toFixed(0)}K - ${(foundPlan.followers_max / 1000).toFixed(0)}K`,
          features: foundPlan.feature_list || foundPlan.features || []
        });
      } else {
        toast.error('Plan not found');
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      toast.error('Failed to load plan details');
      navigate('/pricing');
    } finally {
      setLoading(false);
    }
  };
  
  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const country = data.country_code || 'US';
      setUserCountry(country);
      
      // Auto-select Razorpay for India
      if (country === 'IN') {
        setPaymentMethod('razorpay');
      }
    } catch (error) {
      console.error('Failed to detect country:', error);
    }
  };
  
  // Calculate prices
  const basePrice = billingCycle === 'yearly' ? plan?.yearlyPrice : plan?.monthlyPrice;
  const discount = couponApplied?.discount_percent || 0;
  const discountAmount = basePrice ? (basePrice * discount / 100) : 0;
  const finalPrice = basePrice ? (basePrice - discountAmount) : 0;
  const yearlyTotal = billingCycle === 'yearly' ? finalPrice * 12 : finalPrice;
  const savings = billingCycle === 'yearly' && plan ? (plan.monthlyPrice * 12) - (plan.yearlyPrice * 12) : 0;
  
  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setApplyingCoupon(true);
    setCouponError('');
    
    try {
      const response = await paymentAPI.validateCoupon(couponCode, plan?.slug);
      if (response.data.valid) {
        setCouponApplied(response.data);
        toast.success(`Coupon applied! ${response.data.discount_percent}% off`);
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      // For demo, let's allow some test coupons
      if (couponCode.toUpperCase() === 'WELCOME20') {
        setCouponApplied({ code: 'WELCOME20', discount_percent: 20, message: '20% Welcome Discount' });
        toast.success('Coupon applied! 20% off');
      } else if (couponCode.toUpperCase() === 'ADVERLYX10') {
        setCouponApplied({ code: 'ADVERLYX10', discount_percent: 10, message: '10% Special Discount' });
        toast.success('Coupon applied! 10% off');
      } else {
        setCouponError('Invalid or expired coupon code');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };
  
  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };
  
  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  
  // Process payment
  const processPayment = async () => {
    if (!plan) return;
    
    setProcessing(true);
    
    try {
      const packageId = `${plan.slug}_${billingCycle}`;
      
      if (paymentMethod === 'stripe') {
        // Stripe checkout
        const originUrl = window.location.origin;
        const response = await paymentAPI.createCheckoutSession(packageId, originUrl, couponApplied?.code);
        
        if (response.data.url) {
          window.location.href = response.data.url;
        }
      } else {
        // Razorpay checkout
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load payment gateway');
        }
        
        const response = await paymentAPI.createRazorpayOrder(packageId, couponApplied?.code);
        const orderData = response.data;
        
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Adverlyx Digital',
          description: `${plan.name} - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Plan`,
          order_id: orderData.order_id,
          handler: async function(response) {
            try {
              await paymentAPI.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                package_id: packageId
              });
              navigate('/payment/success');
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            email: user?.email || '',
            name: user?.name || ''
          },
          theme: {
            color: '#ec4899'
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
        setProcessing(false);
        return;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }
  
  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back button */}
          <Link to="/pricing" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </Link>
          
          {/* AI Recommendation Badge */}
          {fromAI && (
            <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">AI Recommended Plan</p>
                <p className="text-sm text-gray-600">Based on your Instagram profile analysis</p>
              </div>
            </div>
          )}
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
                
                {/* Plan Summary */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Crown className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{plan.name} Plan</h3>
                        <p className="text-sm text-gray-600">{plan.followers} followers/month</p>
                        <Badge className="mt-1 bg-pink-100 text-pink-700">
                          {billingCycle === 'yearly' ? 'Annual Billing' : 'Monthly Billing'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${basePrice}</p>
                      <p className="text-sm text-gray-500">/month</p>
                    </div>
                  </div>
                </div>
                
                {/* Coupon Code */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Coupon Code
                  </Label>
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-green-700">{couponApplied.code}</span>
                        <Badge className="bg-green-100 text-green-700">{couponApplied.discount_percent}% OFF</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-gray-500 hover:text-gray-700">
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button 
                        onClick={applyCoupon} 
                        disabled={applyingCoupon}
                        variant="outline"
                      >
                        {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {couponError}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Try: WELCOME20 for 20% off</p>
                </div>
                
                {/* Payment Method */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Payment Method
                  </Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                    <div 
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'stripe' 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('stripe')}
                    >
                      <RadioGroupItem value="stripe" id="stripe" className="sr-only" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-[#635bff] rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Stripe</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Credit/Debit Card</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'razorpay' 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('razorpay')}
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" className="sr-only" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-[#072654] rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">R</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Razorpay</p>
                          <p className="text-xs text-gray-500">UPI, Cards, NetBanking</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                  
                  {userCountry === 'IN' && paymentMethod === 'stripe' && (
                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Razorpay recommended for Indian users (better rates)
                    </p>
                  )}
                </div>
                
                {/* Features */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Plan Features:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Security */}
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>SSL Encrypted</span>
                </div>
              </div>
            </div>
            
            {/* Order Total */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{plan.name} Plan ({billingCycle})</span>
                    <span className="text-gray-900">${basePrice}/mo</span>
                  </div>
                  
                  {billingCycle === 'yearly' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Annual Total (12 months)</span>
                      <span className="text-gray-900">${basePrice * 12}</span>
                    </div>
                  )}
                  
                  {couponApplied && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({couponApplied.discount_percent}%)</span>
                      <span>-${discountAmount.toFixed(2)}/mo</span>
                    </div>
                  )}
                  
                  {billingCycle === 'yearly' && savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Annual Savings</span>
                      <span>-${savings}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${finalPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {billingCycle === 'yearly' ? `$${(finalPrice * 12).toFixed(2)}/year` : '/month'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white h-12 text-base font-semibold"
                  onClick={processPayment}
                  disabled={processing}
                  data-testid="checkout-pay-btn"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay ${finalPrice.toFixed(2)} {billingCycle === 'yearly' ? '/ month' : ''}
                    </>
                  )}
                </Button>
                
                <p className="mt-4 text-xs text-center text-gray-500">
                  By proceeding, you agree to our{' '}
                  <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>
                </p>
                
                {/* Guarantee */}
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">30-Day Money Back Guarantee</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Not satisfied? Get a full refund within 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage;
