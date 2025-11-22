'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../../../components/ProductCard';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unitType: string;
  unitValue: string;
  stockQty: string;
  imageUrl: string | null;
  isActive: boolean;
}

interface SimilarProductsCarouselProps {
  products: Product[];
  onProductClick: (productId: string) => void;
}

export default function SimilarProductsCarousel({
  products,
  onProductClick,
}: SimilarProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = 400; // Scroll amount in pixels
    const currentScroll = scrollRef.current.scrollLeft;
    const targetScroll =
      direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                 bg-white rounded-full shadow-lg p-3
                 hover:bg-gray-50 transition-all duration-300
                 hover:scale-110 active:scale-95
                 -translate-x-4"
        aria-label="Scroll left"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                 bg-white rounded-full shadow-lg p-3
                 hover:bg-gray-50 transition-all duration-300
                 hover:scale-110 active:scale-95
                 translate-x-4"
        aria-label="Scroll right"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth
                 px-4 py-2 -mx-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex-shrink-0 w-72 snap-start"
          >
            <ProductCard
              product={product}
              onClick={() => onProductClick(product.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

