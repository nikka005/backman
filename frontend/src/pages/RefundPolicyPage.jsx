import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { RefreshCw, Clock, CheckCircle, XCircle, Mail } from 'lucide-react';

const RefundPolicyPage = () => {
  const lastUpdated = "January 30, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Refund Policy</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* 30-Day Guarantee Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">30-Day Money-Back Guarantee</h2>
            <p className="text-green-100">We're confident in our service. If you're not satisfied, we'll refund you.</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12 space-y-8">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Refund Guarantee</h2>
              <p className="text-gray-600 leading-relaxed">
                At Adverlyx Digital, we stand behind our service. We offer a 30-day money-back guarantee for all 
                new subscriptions. If you're not satisfied with our service within the first 30 days of your 
                subscription, you can request a full refund—no questions asked.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Refund Eligibility</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Eligible for Refund</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• First-time subscribers within 30 days</li>
                    <li>• Service not meeting expectations</li>
                    <li>• Technical issues preventing usage</li>
                    <li>• Billing errors or duplicate charges</li>
                    <li>• Account compromised before use</li>
                  </ul>
                </div>
                
                <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Not Eligible for Refund</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Requests after 30-day period</li>
                    <li>• Violation of Terms of Service</li>
                    <li>• Account banned by Instagram</li>
                    <li>• Multiple refund requests</li>
                    <li>• Promotional or discounted plans</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How to Request */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How to Request a Refund</h2>
              <p className="text-gray-600 mb-4">To request a refund, follow these steps:</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Contact Support</h4>
                    <p className="text-gray-600 text-sm">Email us at <a href="mailto:refunds@adverlyx.com" className="text-pink-600 hover:underline">refunds@adverlyx.com</a> with your account email and reason for refund.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Verification</h4>
                    <p className="text-gray-600 text-sm">Our team will verify your account and subscription status within 24-48 hours.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Refund Processing</h4>
                    <p className="text-gray-600 text-sm">Once approved, refunds are processed within 5-10 business days to your original payment method.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Processing Times */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Refund Processing Times</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-900">Payment Method</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-900">Processing Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b text-gray-600">Credit/Debit Card (Stripe)</td>
                      <td className="p-3 border-b text-gray-600">5-10 business days</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b text-gray-600">Razorpay (UPI/NetBanking)</td>
                      <td className="p-3 border-b text-gray-600">3-7 business days</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b text-gray-600">PayPal</td>
                      <td className="p-3 border-b text-gray-600">3-5 business days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                * Processing times may vary based on your bank or payment provider.
              </p>
            </section>

            {/* Cancellation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription Cancellation</h2>
              <p className="text-gray-600 mb-4">
                You can cancel your subscription at any time from your dashboard. Upon cancellation:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Your subscription will remain active until the end of your current billing period</li>
                <li>You will not be charged for subsequent billing cycles</li>
                <li>Partial refunds for unused time are not provided for cancellations after 30 days</li>
                <li>You can reactivate your subscription at any time</li>
              </ul>
            </section>

            {/* Pro-Rated Refunds */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pro-Rated Refunds</h2>
              <p className="text-gray-600">
                Pro-rated refunds may be considered on a case-by-case basis for annual subscriptions cancelled 
                after the 30-day guarantee period due to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li>Extended service outages (more than 72 hours)</li>
                <li>Significant changes to service features</li>
                <li>Documented technical issues preventing usage</li>
              </ul>
            </section>

            {/* Chargebacks */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Chargebacks</h2>
              <p className="text-gray-600">
                We encourage you to contact us before initiating a chargeback with your bank. If you file a 
                chargeback without first contacting us, we reserve the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li>Suspend your account immediately</li>
                <li>Contest the chargeback with evidence of service delivery</li>
                <li>Report fraudulent chargebacks to relevant authorities</li>
              </ul>
            </section>

            {/* Contact for Refunds */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For refund requests or questions about our refund policy:
              </p>
              <div className="p-5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-6 h-6 text-pink-600" />
                  <span className="font-semibold text-gray-900">Refund Department</span>
                </div>
                <p className="text-gray-600">Email: <a href="mailto:refunds@adverlyx.com" className="text-pink-600 hover:underline font-semibold">refunds@adverlyx.com</a></p>
                <p className="text-gray-600">Response time: Within 24-48 hours</p>
              </div>
            </section>

            {/* Note */}
            <section className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800">Processing Note</p>
                  <p className="text-sm text-blue-700">
                    Refunds are processed in the order they are received. During peak periods, processing 
                    times may be slightly longer. We appreciate your patience.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link>
            <span className="text-gray-300">|</span>
            <Link to="/cookies" className="text-pink-600 hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicyPage;
