import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import MobileNav from './components/layout/MobileNav';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import FAQPage from './pages/FAQPage';
import DashboardPage from './pages/DashboardPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ConnectInstagramPage from './pages/ConnectInstagramPage';
import AffiliatePage from './pages/AffiliatePage';
import ReferralPage from './pages/ReferralPage';
import HelpPage from './pages/HelpPage';
// Legal Pages
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import DataDeletionPage from './pages/DataDeletionPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallback from './pages/AuthCallback';

// AppRouter component to handle routing
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/case-studies" element={<CaseStudiesPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/connect-instagram" element={<ConnectInstagramPage />} />
      {/* Partner Programs */}
      <Route path="/affiliate" element={<AffiliatePage />} />
      <Route path="/referral" element={<ReferralPage />} />
      <Route path="/help" element={<HelpPage />} />
      {/* Legal Pages */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/refund" element={<RefundPolicyPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/data-deletion" element={<DataDeletionPage />} />
      {/* Admin Routes */}
      <Route path="/backman" element={<AdminLoginPage />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      {/* Catch-all route */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <SiteSettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
            {/* Mobile Bottom Navigation */}
            <MobileNav />
          </BrowserRouter>
        </AuthProvider>
      </SiteSettingsProvider>
    </div>
  );
}

export default App;
