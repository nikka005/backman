import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import TrustedBrands from '../components/home/TrustedBrands';
import TestimonialsSection from '../components/home/TestimonialsSection';
import StatsSection from '../components/home/StatsSection';
import SecretSauceSection from '../components/home/SecretSauceSection';
import BenefitsSection from '../components/home/BenefitsSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import PressSection from '../components/home/PressSection';
import PricingSection from '../components/home/PricingSection';
import FAQSection from '../components/home/FAQSection';
import ReviewsSection from '../components/home/ReviewsSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <TrustedBrands />
        <TestimonialsSection />
        <StatsSection />
        <SecretSauceSection />
        <BenefitsSection />
        <HowItWorksSection />
        <PressSection />
        <PricingSection />
        <FAQSection />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
