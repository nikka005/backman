import React from 'react';
import { reviews } from '../../data/mockData';
import { Star } from 'lucide-react';

const ReviewsSection = () => {
  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8">
          {reviews.map((review) => (
            <div
              key={review.platform}
              className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">{review.platform}</p>
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(parseFloat(review.rating))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">{review.rating}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">{review.reviews} reviews</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
