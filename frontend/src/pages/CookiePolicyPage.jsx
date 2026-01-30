import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Cookie, Settings, Info, ToggleLeft, ToggleRight } from 'lucide-react';

const CookiePolicyPage = () => {
  const lastUpdated = "January 30, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12 space-y-8">
            {/* What Are Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when 
                you visit a website. They help websites remember your preferences, understand how you use the 
                site, and improve your overall experience. Cookies are widely used across the internet and are 
                essential for many website features to function properly.
              </p>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-600 mb-4">Adverlyx Digital uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Authentication:</strong> To keep you logged in and secure your session</li>
                <li><strong>Preferences:</strong> To remember your settings and preferences</li>
                <li><strong>Analytics:</strong> To understand how you use our platform</li>
                <li><strong>Performance:</strong> To optimize loading times and functionality</li>
                <li><strong>Security:</strong> To detect and prevent fraud and abuse</li>
              </ul>
            </section>

            {/* Types of Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Always Active</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies are necessary for the website to function and cannot be switched off. They 
                    are usually set in response to actions you take, such as logging in or filling out forms.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p><strong>Examples:</strong> Session ID, CSRF token, authentication tokens</p>
                    <p><strong>Duration:</strong> Session / Up to 7 days</p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Optional</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p><strong>Examples:</strong> Google Analytics, usage patterns, page views</p>
                    <p><strong>Duration:</strong> Up to 2 years</p>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="p-5 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Optional</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your preferences and settings.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p><strong>Examples:</strong> Language preference, theme settings, dashboard layout</p>
                    <p><strong>Duration:</strong> Up to 1 year</p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="p-5 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Optional</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies may be set through our site by advertising partners to build a profile 
                    of your interests and show you relevant ads on other sites.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p><strong>Examples:</strong> Facebook Pixel, Google Ads, retargeting</p>
                    <p><strong>Duration:</strong> Up to 2 years</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-600 mb-4">
                We may use third-party services that set their own cookies. These include:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-900">Service</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-900">Purpose</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-900">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b text-gray-600">Google Analytics</td>
                      <td className="p-3 border-b text-gray-600">Website analytics</td>
                      <td className="p-3 border-b"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">View</a></td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b text-gray-600">Stripe</td>
                      <td className="p-3 border-b text-gray-600">Payment processing</td>
                      <td className="p-3 border-b"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">View</a></td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b text-gray-600">Razorpay</td>
                      <td className="p-3 border-b text-gray-600">Payment processing</td>
                      <td className="p-3 border-b"><a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">View</a></td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b text-gray-600">Meta (Instagram)</td>
                      <td className="p-3 border-b text-gray-600">OAuth authentication</td>
                      <td className="p-3 border-b"><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">View</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-gray-600 mb-4">
                You have several options for managing cookies:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Browser Settings</h4>
                    <p className="text-sm text-gray-600">Most browsers allow you to control cookies through their settings. You can block or delete cookies, but this may affect website functionality.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <ToggleRight className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Cookie Consent Banner</h4>
                    <p className="text-sm text-gray-600">When you first visit our site, you can choose which non-essential cookies to accept or reject.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Opt-Out Links</h4>
                    <p className="text-sm text-gray-600">
                      <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">Google Analytics Opt-out</a> | 
                      <a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline ml-2">NAI Opt-out</a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Browser Instructions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. How to Manage Cookies in Your Browser</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-semibold text-gray-900">Google Chrome</p>
                  <p className="text-sm text-pink-600">Manage cookies →</p>
                </a>
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-semibold text-gray-900">Mozilla Firefox</p>
                  <p className="text-sm text-pink-600">Manage cookies →</p>
                </a>
                <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-semibold text-gray-900">Safari</p>
                  <p className="text-sm text-pink-600">Manage cookies →</p>
                </a>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-semibold text-gray-900">Microsoft Edge</p>
                  <p className="text-sm text-pink-600">Manage cookies →</p>
                </a>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Policy</h2>
              <p className="text-gray-600">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                other operational, legal, or regulatory reasons. We encourage you to review this policy 
                periodically. The date at the top of this page indicates when the policy was last updated.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700"><strong>Adverlyx Digital</strong></p>
                <p className="text-gray-600">Email: <a href="mailto:privacy@adverlyx.com" className="text-pink-600 hover:underline">privacy@adverlyx.com</a></p>
              </div>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link>
            <span className="text-gray-300">|</span>
            <Link to="/refund" className="text-pink-600 hover:underline">Refund Policy</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
