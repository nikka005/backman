import React, { useState } from 'react';
import { testimonials, categories } from '../../data/mockData';
import { Play, Users, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const TestimonialsSection = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTestimonials = activeCategory === 'All'
    ? testimonials
    : testimonials.filter(t => t.category === activeCategory);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Client Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied clients who have transformed their Instagram presence with Adverlyx
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full ${
                activeCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group"
            >
              {/* Category Badge */}
              <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700">
                {testimonial.category}
              </Badge>

              {/* Profile Section */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-pink-100"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.handle}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-y border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900">{testimonial.memberSince}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-gray-500">Followers</p>
                  <p className="text-sm font-semibold text-gray-900">{testimonial.followers}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-gray-500">Growth</p>
                  <p className="text-sm font-semibold text-green-600">{testimonial.growth}</p>
                </div>
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-sm italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Over 15,000+ people currently use Adverlyx to grow!</p>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8">
            View All Success Stories
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
