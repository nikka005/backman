import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Search, HelpCircle, CreditCard, Instagram, Settings,
  Shield, Zap, MessageSquare, ChevronRight, Mail, Phone
} from 'lucide-react';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { icon: Zap, title: 'Getting Started', desc: 'New to Adverlyx? Start here', path: '/faq#getting-started' },
    { icon: Instagram, title: 'Instagram Connection', desc: 'Connect and manage accounts', path: '/faq#instagram' },
    { icon: CreditCard, title: 'Billing & Plans', desc: 'Payments, upgrades, refunds', path: '/faq#billing' },
    { icon: Settings, title: 'Account Settings', desc: 'Profile, security, preferences', path: '/faq#account' },
    { icon: Shield, title: 'Safety & Privacy', desc: 'Data protection, account safety', path: '/faq#safety' },
    { icon: HelpCircle, title: 'Troubleshooting', desc: 'Common issues and fixes', path: '/faq#troubleshooting' },
  ];

  const popularArticles = [
    { title: 'How to connect my Instagram account', path: '/faq#connect' },
    { title: 'Understanding your growth dashboard', path: '/faq#dashboard' },
    { title: 'Changing or upgrading your plan', path: '/faq#upgrade' },
    { title: 'Setting up targeting preferences', path: '/faq#targeting' },
    { title: 'How does AI growth optimization work?', path: '/faq#ai' },
    { title: 'Cancellation and refund policy', path: '/faq#refund' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How can we help?
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Search our knowledge base or browse categories below
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link key={i} to={cat.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <cat.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{cat.title}</h3>
                      <p className="text-sm text-gray-500">{cat.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Popular Articles</h2>
          <Card>
            <CardContent className="p-0">
              {popularArticles.map((article, i) => (
                <Link
                  key={i}
                  to={article.path}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0"
                >
                  <span>{article.title}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
              <p className="mb-6 opacity-90">
                Our support team is available 24/7 to assist you
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button variant="secondary" size="lg">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/20">
                  <Phone className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpPage;
