import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { publicAPI } from '../services/api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Button } from '../components/ui/button';
import { HelpCircle, MessageCircle, Mail, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      const response = await publicAPI.getFaqs();
      setFaqs(response.data);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      // Fallback FAQs
      setFaqs([
        { question: 'Who should use Adverlyx Digital?', answer: 'Adverlyx is for anyone who wants to grow their Instagram account organically.' },
        { question: 'What is required to use Adverlyx?', answer: 'All you need is an Instagram account.' },
        { question: 'How many followers can I get?', answer: 'You can expect at least 1,000 followers per month with our Basic plan.' },
        { question: 'Is Adverlyx safe to use?', answer: 'Yes! We use organic growth strategies that comply with Instagram\'s terms.' },
        { question: 'How long to see results?', answer: 'Results typically appear within the first 24-48 hours.' },
        { question: 'How do I cancel?', answer: 'Cancel anytime through your dashboard. No hidden fees.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Group FAQs into categories
  const faqCategories = faqs.length > 0 ? [
    {
      title: 'Getting Started',
      questions: faqs.slice(0, Math.ceil(faqs.length / 3))
    },
    {
      title: 'Account & Safety',
      questions: faqs.slice(Math.ceil(faqs.length / 3), Math.ceil(faqs.length * 2 / 3))
    },
    {
      title: 'Billing & Plans',
      questions: faqs.slice(Math.ceil(faqs.length * 2 / 3))
    }
  ].filter(cat => cat.questions.length > 0) : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 mb-6">
              <HelpCircle className="w-8 h-8 text-pink-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Frequently Asked <span className="text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">Questions</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Adverlyx. Can't find what you're looking for? Contact our support team.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : (
              <div className="space-y-12" data-testid="faq-list">
                {faqCategories.map((category, catIdx) => (
                  <div key={catIdx}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.title}</h2>
                    <Accordion type="single" collapsible className="space-y-4">
                      {category.questions.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`${catIdx}-item-${index}`}
                          className="bg-white rounded-xl border border-gray-200 px-6 overflow-hidden hover:border-pink-200 transition-colors"
                          data-testid={`faq-item-${catIdx}-${index}`}
                        >
                          <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-pink-600 py-5 hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 pb-5 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-600">
                Our support team is here to help you 24/7
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-pink-200 hover:shadow-lg transition-all text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Chat with our support team in real-time</p>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full">
                  Start Chat
                </Button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-pink-200 hover:shadow-lg transition-all text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">We'll respond within 24 hours</p>
                <Button variant="outline" className="rounded-full border-gray-300">
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Growing?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join 55,000+ users transforming their Instagram presence
            </p>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full px-10 py-6 text-lg group">
                Get Started Free
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
