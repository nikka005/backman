import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Check, Loader2, XCircle, ArrowRight, PartyPopper } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;
  const sessionId = searchParams.get('session_id');
  
  // Check if coming from Razorpay (no session_id but has state or direct navigation)
  const isRazorpay = !sessionId;

  useEffect(() => {
    if (sessionId) {
      // Stripe flow - poll for status
      pollPaymentStatus();
    } else {
      // Razorpay flow - payment already verified, show success
      setStatus('success');
      setPaymentData({
        plan: location.state?.plan || 'Your',
        billing: location.state?.billing || 'subscription',
        provider: 'razorpay'
      });
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await paymentAPI.getCheckoutStatus(sessionId);
      const data = response.data;
      setPaymentData(data);

      if (data.payment_status === 'paid') {
        setStatus('success');
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'checking' && (
          <>
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-500 mb-6">Please wait while we confirm your payment...</p>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < attempts ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <PartyPopper className="w-6 h-6 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
              <PartyPopper className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-gray-500 mb-6">
              Welcome to the <span className="font-semibold capitalize">{paymentData?.plan}</span> plan!
              Your subscription is now active.
            </p>
            {paymentData?.amount_total && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium capitalize">{paymentData?.plan}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Billing</span>
                  <span className="font-medium capitalize">{paymentData?.billing}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">
                    {paymentData?.provider === 'razorpay' 
                      ? `₹${paymentData?.amount_total}`
                      : `$${(paymentData?.amount_total / 100).toFixed(2)} ${paymentData?.currency?.toUpperCase()}`
                    }
                  </span>
                </div>
              </div>
            )}
            <Link to="/dashboard">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-2">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
            <p className="text-gray-500 mb-6">Your payment session has expired. Please try again.</p>
            <Link to="/pricing">
              <Button className="w-full bg-gray-900 text-white">
                Back to Pricing
              </Button>
            </Link>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Still Processing</h1>
            <p className="text-gray-500 mb-6">
              Your payment is taking longer than expected. Check your email for confirmation or contact support.
            </p>
            <div className="flex gap-3">
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Dashboard</Button>
              </Link>
              <Link to="/contact" className="flex-1">
                <Button className="w-full bg-gray-900 text-white">Contact Support</Button>
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
            <p className="text-gray-500 mb-6">We couldn't verify your payment. Please contact support.</p>
            <Link to="/pricing">
              <Button className="w-full bg-gray-900 text-white">
                Back to Pricing
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
