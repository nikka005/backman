import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Shield, Lock, Eye, Database, Globe, Mail } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const lastUpdated = "January 30, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to Adverlyx Digital ("we," "our," or "us"). We are committed to protecting your privacy 
                and ensuring the security of your personal information. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our Instagram growth platform and services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Account registration information (name, email address, password)</li>
                <li>Instagram account username and profile information</li>
                <li>Payment and billing information</li>
                <li>Communication preferences and support inquiries</li>
                <li>Targeting preferences (niche, hashtags, competitors, locations)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2 Information from Instagram</h3>
              <p className="text-gray-600 mb-3">When you connect your Instagram account via OAuth, we may access:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Public profile information (username, bio, profile picture)</li>
                <li>Follower and following counts</li>
                <li>Media posts and engagement metrics</li>
                <li>Account insights and analytics (for Business/Creator accounts)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Analyze your Instagram account to provide AI-powered growth recommendations</li>
                <li>Customize and optimize your growth targeting settings</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Respond to customer service requests and support needs</li>
                <li>Monitor and analyze usage trends and preferences</li>
                <li>Detect, prevent, and address technical issues or fraud</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600 mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (payment processors, hosting providers, analytics services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you have given us permission to share</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Encryption</p>
                  <p className="text-sm text-gray-600">SSL/TLS encryption</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Secure Storage</p>
                  <p className="text-sm text-gray-600">Protected databases</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Access Control</p>
                  <p className="text-sm text-gray-600">Limited access</p>
                </div>
              </div>
              <p className="text-gray-600">
                We implement appropriate technical and organizational security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. However, no 
                method of transmission over the Internet is 100% secure.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information for as long as your account is active or as needed to provide 
                you services. We will retain and use your information as necessary to comply with our legal 
                obligations, resolve disputes, and enforce our agreements. You may request deletion of your 
                account and associated data at any time.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Disconnect:</strong> Revoke Instagram access at any time</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@adverlyx.com" className="text-pink-600 hover:underline">privacy@adverlyx.com</a>
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-600">
                Your information may be transferred to and maintained on servers located outside of your 
                country of residence. We ensure that such transfers comply with applicable data protection 
                laws and that appropriate safeguards are in place.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-600">
                Our services are not intended for individuals under the age of 18. We do not knowingly 
                collect personal information from children. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. You are 
                advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700"><strong>Adverlyx Digital</strong></p>
                <p className="text-gray-600">Email: <a href="mailto:privacy@adverlyx.com" className="text-pink-600 hover:underline">privacy@adverlyx.com</a></p>
                <p className="text-gray-600">Support: <a href="mailto:support@adverlyx.com" className="text-pink-600 hover:underline">support@adverlyx.com</a></p>
              </div>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link>
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

export default PrivacyPolicyPage;
