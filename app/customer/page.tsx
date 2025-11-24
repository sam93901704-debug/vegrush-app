'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from './components/ProductCard';
import { ProductListSkeleton } from '../components/ui/Skeleton';
import { SearchBar } from '../components/ui/SearchBar';
import HeroSection from './components/HeroSection';
import CategoryChip from './components/CategoryChip';
import SortMenu, { SortOption } from './components/SortMenu';
import toast from 'react-hot-toast';

// Category definitions with icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Vegetables': (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  'Fruits': (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Greens': (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

const DEFAULT_CATEGORIES = ['Vegetables', 'Fruits', 'Greens'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export default function CustomerHomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch products with React Query
  const { data, isLoading, error, refetch } = useProducts({
    page: 1,
    limit: 100, // Load more products at once for better UX
    category: selectedCategory || undefined,
    search: debouncedSearch || undefined,
  });

  // Extract categories from products
  const categories = useMemo(() => {
    if (!data?.data) return DEFAULT_CATEGORIES;
    const uniqueCategories = Array.from(new Set(data.data.map((p) => p.category)));
    return uniqueCategories.length > 0 ? uniqueCategories : DEFAULT_CATEGORIES;
  }, [data]);

  // Sort products client-side
  const sortedProducts = useMemo(() => {
    if (!data?.data) return [];
    const sorted = [...data.data];

    switch (sortOption) {
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'recommended':
      default:
        return sorted;
    }
  }, [data, sortOption]);

  // Handle errors
  if (error) {
    toast.error('Failed to load products');
  }

  const handleProductClick = (productId: string) => {
    window.location.href = `/customer/products/${productId}`;
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
        {/* Hero Section */}
        <HeroSection />

        {/* Search Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search fresh produce..."
          />
        </motion.div>

        {/* Filters Row */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Category Chips */}
            <div className="flex-1 w-full md:w-auto overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 pb-2 scrollbar-hide">
                <CategoryChip
                  label="All"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  }
                  isSelected={selectedCategory === ''}
                  onClick={() => setSelectedCategory('')}
                />
                {categories.slice(0, 10).map((category) => (
                  <CategoryChip
                    key={category}
                    label={category}
                    icon={CATEGORY_ICONS[category] || CATEGORY_ICONS['Vegetables']}
                    isSelected={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                  />
                ))}
              </div>
            </div>

            {/* Sort Menu */}
            <div className="w-full md:w-auto">
              <SortMenu selectedSort={sortOption} onSortChange={setSortOption} />
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProductListSkeleton count={8} />
            </motion.div>
          ) : sortedProducts.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <svg
                className="w-16 h-16 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-xl text-slate-600 font-medium">No products found</p>
              <p className="text-sm text-slate-400 mt-2">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            >
              <AnimatePresence>
                {sortedProducts.map((product) => (
                  <motion.div key={product.id} variants={itemVariants} layout>
                    <ProductCard
                      product={product}
                      onClick={() => handleProductClick(product.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
}
