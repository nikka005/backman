import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { testimonials, categories } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, TrendingUp, Calendar, ChevronRight, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

const CaseStudiesPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTestimonials = activeCategory === 'All'
    ? testimonials
    : testimonials.filter(t => t.category === activeCategory);

  const featuredCase = {
    name: 'Marcus Johnson',
    handle: '@marcusjohnson',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
    category: 'Entrepreneur',
    followers: '892K',
    growth: '+156K',
    engagement: '6.2%',
    memberSince: 'Mar 2023',
    story: 'As an entrepreneur building my personal brand, I needed authentic growth that would translate into real business opportunities. Adverlyx delivered beyond my expectations.',
    results: [
      'Grew from 736K to 892K followers in 8 months',
      'Engagement rate increased from 2.1% to 6.2%',
      'Landed 3 major brand partnerships',
      'Revenue increased by 340%'
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="bg-green-100 text-green-700 mb-4">
              Real Results, Real People
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Client <span className="text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">Success Stories</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover how brands, influencers, and entrepreneurs are growing their Instagram with Adverlyx
            </p>
          </div>
        </section>

        {/* Featured Case Study */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white mb-6">
                    Featured Case Study
                  </Badge>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={featuredCase.avatar}
                      alt={featuredCase.name}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-pink-500/30"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{featuredCase.name}</h3>
                      <p className="text-gray-400">{featuredCase.handle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <Quote className="w-10 h-10 text-pink-500 mb-4" />
                  <p className="text-xl text-gray-300 mb-8 italic">
                    "{featuredCase.story}"
                  </p>
                  
                  <div className="space-y-3">
                    {featuredCase.results.map((result, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500"></div>
                        <span className="text-gray-300">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-8 lg:p-12 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <Users className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-white">{featuredCase.followers}</p>
                      <p className="text-sm text-gray-400">Followers</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-400">{featuredCase.growth}</p>
                      <p className="text-sm text-gray-400">Growth</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-white">{featuredCase.engagement}</p>
                      <p className="text-sm text-gray-400">Engagement</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-white">{featuredCase.memberSince}</p>
                      <p className="text-sm text-gray-400">Member Since</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full ${
                    activeCategory === category
                      ? 'bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700">
                    {testimonial.category}
                  </Badge>

                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-pink-100"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.handle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-y border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Since</p>
                      <p className="text-sm font-semibold text-gray-900">{testimonial.memberSince}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Followers</p>
                      <p className="text-sm font-semibold text-gray-900">{testimonial.followers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Growth</p>
                      <p className="text-sm font-semibold text-green-600">{testimonial.growth}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm italic">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of satisfied users and start growing your Instagram today
            </p>
            <Link to="/signup">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 py-6 text-lg group">
                Start Your Growth Journey
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

export default CaseStudiesPage;
