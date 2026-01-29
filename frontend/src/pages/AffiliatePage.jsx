import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  DollarSign, Users, TrendingUp, Gift, Check, 
  ArrowRight, Loader2, Percent, Clock, CreditCard
} from 'lucide-react';
import api from '../services/api';

const AffiliatePage = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    website: '',
    social_media: '',
    audience_size: '',
    promotion_methods: '',
    why_join: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/programs/affiliate/apply', form);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Percent, title: '20% Commission', desc: 'Earn on every sale you refer' },
    { icon: Clock, title: '30-Day Cookie', desc: 'Extended tracking window' },
    { icon: CreditCard, title: 'Monthly Payouts', desc: 'Reliable payment schedule' },
    { icon: TrendingUp, title: 'Real-time Stats', desc: 'Track your performance' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white">Partner Program</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Adverlyx Affiliate Program
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Earn 20% commission on every sale. Join 500+ affiliates earning passive income.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-6">
                  <b.icon className="w-10 h-10 mx-auto mb-3 text-pink-500" />
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-gray-500">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          {submitted ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  We'll review your application and get back to you within 48 hours.
                </p>
                <Link to="/">
                  <Button>Return Home</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Apply to Become an Affiliate</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Website</label>
                      <Input
                        value={form.website}
                        onChange={(e) => setForm({...form, website: e.target.value})}
                        placeholder="https://yoursite.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Social Media</label>
                      <Input
                        value={form.social_media}
                        onChange={(e) => setForm({...form, social_media: e.target.value})}
                        placeholder="@youraccount"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Audience Size</label>
                    <Input
                      value={form.audience_size}
                      onChange={(e) => setForm({...form, audience_size: e.target.value})}
                      placeholder="e.g., 10,000 followers"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">How will you promote Adverlyx? *</label>
                    <Textarea
                      required
                      value={form.promotion_methods}
                      onChange={(e) => setForm({...form, promotion_methods: e.target.value})}
                      placeholder="Blog posts, social media, email list, YouTube..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Why do you want to join? *</label>
                    <Textarea
                      required
                      value={form.why_join}
                      onChange={(e) => setForm({...form, why_join: e.target.value})}
                      placeholder="Tell us about your interest in promoting Adverlyx..."
                      rows={3}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Application
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AffiliatePage;
