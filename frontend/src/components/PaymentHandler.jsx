import React, { useState, useEffect, useCallback } from 'react';
import { paymentAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Check, CreditCard, Globe, AlertCircle } from 'lucide-react';

// Load Razorpay script dynamically
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

const PaymentHandler = ({ 
  planId, 
  planName, 
  billingCycle = 'monthly', 
  onSuccess, 
  onError,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);

  // Fetch localized pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await paymentAPI.getLocalizedPricing();
        setPricingData(response.data);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      } finally {
        setLoadingPricing(false);
      }
    };
    fetchPricing();
  }, []);

  const handleStripePayment = async (packageId) => {
    try {
      const response = await paymentAPI.createStripeCheckout(
        packageId,
        window.location.origin
      );
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      onError?.(error.message || 'Payment failed');
    }
  };

  const handleRazorpayPayment = async (packageId) => {
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Create order
      const response = await paymentAPI.createRazorpayOrder(packageId);
      const orderData = response.data;

      // Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Adverlyx Digital',
        description: `${planName} Plan - ${billingCycle}`,
        prefill: {
          name: orderData.user_name,
          email: orderData.user_email,
        },
        theme: {
          color: '#ec4899', // Pink color to match branding
        },
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await paymentAPI.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verifyResponse.data.success) {
              onSuccess?.(verifyResponse.data);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onError?.(error.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      onError?.(error.message || 'Payment failed');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    const packageId = `${planId}_${billingCycle}`;
    const provider = pricingData?.payment_provider || 'stripe';
    
    try {
      if (provider === 'razorpay') {
        await handleRazorpayPayment(packageId);
      } else {
        await handleStripePayment(packageId);
      }
    } catch (error) {
      setLoading(false);
      onError?.(error.message || 'Payment failed');
    }
  };

  // Get display price
  const getDisplayPrice = () => {
    if (!pricingData) return null;
    
    const plan = pricingData.plans?.find(p => 
      p.id === planId || p.name?.toLowerCase() === planId?.toLowerCase()
    );
    
    if (!plan) return null;
    
    const price = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
    const symbol = pricingData.currency_symbol || '$';
    
    // Format based on currency
    if (['JPY', 'KRW', 'VND', 'IDR'].includes(pricingData.currency)) {
      return `${symbol}${Math.round(price).toLocaleString()}`;
    }
    return `${symbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loadingPricing) {
    return (
      <Button disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full gap-2 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay {getDisplayPrice()}
          </>
        )}
      </Button>
      
      {pricingData && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Globe className="w-3 h-3" />
          <span>
            Paying in {pricingData.currency} via {pricingData.payment_provider === 'razorpay' ? 'Razorpay' : 'Stripe'}
          </span>
        </div>
      )}
    </div>
  );
};

// Currency-aware Pricing Display Component
export const LocalizedPrice = ({ planId, billingCycle = 'monthly', className = '' }) => {
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await paymentAPI.getLocalizedPricing();
        setPricingData(response.data);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  if (loading) {
    return <span className={`animate-pulse ${className}`}>...</span>;
  }

  if (!pricingData) {
    return null;
  }

  const plan = pricingData.plans?.find(p => 
    p.id === planId || p.name?.toLowerCase() === planId?.toLowerCase()
  );

  if (!plan) return null;

  const price = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
  const symbol = pricingData.currency_symbol || '$';

  // Format based on currency
  let formattedPrice;
  if (['JPY', 'KRW', 'VND', 'IDR'].includes(pricingData.currency)) {
    formattedPrice = `${symbol}${Math.round(price).toLocaleString()}`;
  } else {
    formattedPrice = `${symbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <span className={className}>
      {formattedPrice}
      {billingCycle === 'yearly' && <span className="text-sm text-gray-500">/year</span>}
      {billingCycle === 'monthly' && <span className="text-sm text-gray-500">/mo</span>}
    </span>
  );
};

// Currency Badge Component
export const CurrencyBadge = () => {
  const [pricingData, setPricingData] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await paymentAPI.getLocalizedPricing();
        setPricingData(response.data);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      }
    };
    fetchPricing();
  }, []);

  if (!pricingData) return null;

  return (
    <Badge variant="outline" className="gap-1">
      <Globe className="w-3 h-3" />
      {pricingData.currency}
    </Badge>
  );
};

export default PaymentHandler;
