import React from 'react';
import { Button } from '../ui/button';
import { Star, MessageCircle } from 'lucide-react';

const PressSection = () => {
  const pressLogos = [
    { name: 'Forbes', quote: 'The most disruptive innovation in social marketing services in 2024.' },
    { name: 'TechCrunch', quote: 'Social growth tools like Adverlyx are innovating to level the playing field.' },
    { name: 'Business Insider', quote: 'Creating micro-connections that build into an active and engaged community.' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            As Seen In
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Rely on our experience in your social media growth strategy
          </h2>
        </div>

        {/* Press Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {pressLogos.map((press, index) => (
            <div
              key={press.name}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-pink-500" />
                <span className="font-bold text-gray-900 text-lg">{press.name}</span>
              </div>
              <p className="text-gray-600 italic leading-relaxed">
                "{press.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PressSection;
