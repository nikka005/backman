import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Gift, Users, DollarSign, Copy, Check, Share2,
  ArrowRight, Loader2, Twitter, Facebook, Mail
} from 'lucide-react';
import api from '../services/api';

const ReferralPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralInfo, setReferralInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralInfo();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadReferralInfo = async () => {
    try {
      const response = await api.get('/programs/referral/info');
      setReferralInfo(response.data);
    } catch (error) {
      console.error('Failed to load referral info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (referralInfo?.referral_link) {
      navigator.clipboard.writeText(referralInfo.referral_link);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`I'm using Adverlyx for Instagram growth and it's amazing! Sign up with my link and get 20% off: ${referralInfo?.referral_link}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralInfo?.referral_link)}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent('Try Adverlyx - Get 20% Off!');
    const body = encodeURIComponent(`Hey! I've been using Adverlyx for Instagram growth and it's been amazing. Use my referral link to get 20% off your first month: ${referralInfo?.referral_link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const steps = [
    { icon: Share2, title: 'Share Your Link', desc: 'Send your unique link to friends' },
    { icon: Users, title: 'Friends Sign Up', desc: 'They create an account using your link' },
    { icon: Gift, title: 'Both Get Rewarded', desc: 'You get $10, they get 20% off!' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-green-600 via-teal-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white">Refer & Earn</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Give $10, Get $10
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Invite friends to Adverlyx. They get 20% off, you get $10 credit. Win-win!
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          {!user ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">Sign In to Get Your Referral Link</h2>
                <p className="text-gray-600 mb-6">
                  Create an account or log in to start earning referral rewards.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <a href="/login">Log In</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/signup">Sign Up</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" />
            </div>
          ) : (
            <>
              {/* Referral Link Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Your Referral Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={referralInfo?.referral_link || ''}
                      className="bg-gray-50"
                    />
                    <Button onClick={copyLink}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {/* Share Buttons */}
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={shareOnTwitter}>
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareOnFacebook}>
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareByEmail}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Referral Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {referralInfo?.total_referrals || 0}
                      </p>
                      <p className="text-sm text-gray-500">Total Referrals</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {referralInfo?.successful_referrals || 0}
                      </p>
                      <p className="text-sm text-gray-500">Successful</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-500">
                        ${referralInfo?.pending_rewards || 0}
                      </p>
                      <p className="text-sm text-gray-500">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        ${referralInfo?.total_rewards || 0}
                      </p>
                      <p className="text-sm text-gray-500">Total Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReferralPage;
