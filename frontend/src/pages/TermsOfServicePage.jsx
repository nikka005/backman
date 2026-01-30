import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const TermsOfServicePage = () => {
  const lastUpdated = "January 30, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Adverlyx Digital ("Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms 
                apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                Adverlyx Digital provides an AI-powered Instagram growth platform that helps users grow their 
                Instagram following organically through:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>AI-powered targeting and optimization</li>
                <li>Organic engagement strategies</li>
                <li>Analytics and growth tracking</li>
                <li>Personalized growth recommendations</li>
              </ul>
            </section>

            {/* Account Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Terms</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You must be 18 years or older to use this Service</li>
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account and password</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You may not use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            {/* Instagram Account Requirements */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Instagram Account Requirements</h2>
              <p className="text-gray-600 mb-4">By connecting your Instagram account, you represent and warrant that:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                  <p className="font-semibold text-gray-900 mb-2">You Must:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Own the Instagram account</li>
                    <li>• Have a public or business account</li>
                    <li>• Comply with Instagram's Terms</li>
                    <li>• Have authentic followers</li>
                  </ul>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600 mb-2" />
                  <p className="font-semibold text-gray-900 mb-2">You Must Not:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use fake or bot accounts</li>
                    <li>• Violate Instagram's policies</li>
                    <li>• Share account credentials</li>
                    <li>• Use for illegal activities</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
              <p className="text-gray-600 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit spam, malware, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Engage in any activity that could damage our reputation</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Resell or redistribute our services without authorization</li>
              </ul>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All fees are quoted in USD unless otherwise specified</li>
                <li>Payment is due at the beginning of each billing cycle</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>You authorize us to charge your payment method for all fees incurred</li>
                <li>Prices may change with 30 days notice to existing subscribers</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
              <p className="text-gray-600 mt-4">
                For refund information, please see our{' '}
                <Link to="/refund" className="text-pink-600 hover:underline">Refund Policy</Link>.
              </p>
            </section>

            {/* Service Guarantees */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Guarantees & Disclaimers</h2>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Important Disclaimer</p>
                    <p className="text-sm text-amber-700">
                      Results may vary. We do not guarantee specific follower counts or engagement rates. 
                      Instagram's algorithm and policies can affect growth outcomes.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                The Service is provided "as is" without warranties of any kind. We do not warrant that the 
                Service will be uninterrupted, secure, or error-free. We are not responsible for any actions 
                taken by Instagram regarding your account.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-600">
                The Service and its original content, features, and functionality are owned by Adverlyx Digital 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of 
                our Service without explicit permission.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600">
                In no event shall Adverlyx Digital, its directors, employees, partners, agents, suppliers, or 
                affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-600 mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for 
                any reason, including without limitation if you breach the Terms. Upon termination:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>We may delete your account and associated data</li>
                <li>You remain liable for all charges incurred prior to termination</li>
                <li>Provisions that by their nature should survive will survive termination</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-600">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
                in which Adverlyx Digital operates, without regard to its conflict of law provisions. Any 
                disputes arising from these Terms will be resolved through binding arbitration.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will try to provide at least 30 days notice prior to any new terms taking effect. What 
                constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700"><strong>Adverlyx Digital</strong></p>
                <p className="text-gray-600">Email: <a href="mailto:legal@adverlyx.com" className="text-pink-600 hover:underline">legal@adverlyx.com</a></p>
                <p className="text-gray-600">Support: <a href="mailto:support@adverlyx.com" className="text-pink-600 hover:underline">support@adverlyx.com</a></p>
              </div>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="/cookies" className="text-pink-600 hover:underline">Cookie Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="/refund" className="text-pink-600 hover:underline">Refund Policy</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
