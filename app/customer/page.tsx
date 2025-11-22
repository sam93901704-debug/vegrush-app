'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import ProductCard from './components/ProductCard';
import ProductCardSkeleton from './components/ProductCardSkeleton';
import HeroSection from './components/HeroSection';
import CategoryChip from './components/CategoryChip';
import SortMenu, { SortOption } from './components/SortMenu';

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

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

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

// Default categories if none found
const DEFAULT_CATEGORIES = ['Vegetables', 'Fruits', 'Greens'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

export default function CustomerHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debounce search query to 300ms
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch products
  const fetchProducts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params = new URLSearchParams();
        params.append('page', pageNum.toString());
        params.append('limit', '20');
        if (debouncedSearch) {
          params.append('search', debouncedSearch);
        }
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }

        const response = await fetch(
          `http://localhost:4000/api/products?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data: ProductsResponse = await response.json();
        const newProducts = data.data || [];

        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        // Check if there are more products
        const totalPages = Math.ceil(data.pagination.total / data.pagination.limit);
        setHasMore(pageNum < totalPages);

        // Extract unique categories from new products
        const uniqueCategories = Array.from(
          new Set(newProducts.map((p) => p.category))
        );
        
        // Merge with existing categories and add defaults if needed
        setCategories((prevCategories) => {
          const merged = Array.from(new Set([...prevCategories, ...uniqueCategories]));
          // If no categories found, use defaults
          if (merged.length === 0 && reset) {
            return DEFAULT_CATEGORIES;
          }
          return merged;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedCategory]
  );

  // Pull to refresh
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await fetchProducts(1, true);
    },
    enabled: true,
    threshold: 80,
  });

  // Sort products client-side
  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    
    switch (sortOption) {
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'recommended':
      default:
        // Keep original order (recommended = newest first, which is default from API)
        return sorted;
    }
  }, [products, sortOption]);

  // Initial load and when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setIsTransitioning(true);
    
    // Add fade transition
    const timer = setTimeout(() => {
      fetchProducts(1, true);
    }, 150);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory]);
  
  // Handle sort change with fade transition
  const handleSortChange = (sort: SortOption) => {
    setIsTransitioning(true);
    setSortOption(sort);
    // Transition happens immediately via sortedProducts useMemo
    setTimeout(() => setIsTransitioning(false), 300);
  };
  
  // Reset transition state after products are loaded
  useEffect(() => {
    if (!loading && products.length > 0) {
      const timer = setTimeout(() => setIsTransitioning(false), 200);
      return () => clearTimeout(timer);
    }
  }, [loading, products.length]);

  // Load more when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (!loadingMore && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, loading, page]);

  const handleProductClick = (productId: string) => {
    window.location.href = `/customer/products/${productId}`;
  };

  // Get display categories (prioritize found categories, fallback to defaults)
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Refreshing...</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Hero Section */}
        <HeroSection />

        {/* Search Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search fresh produce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 pr-4 rounded-full border-2 border-gray-200 
                       shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 
                       focus:border-green-500 text-lg bg-white
                       transition-all duration-300"
            />
            <svg
              className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Filters Row: Category Chips + Sort Menu */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Category Row - Scrollable */}
            <div className="flex-1 w-full md:w-auto">
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-1">
                {/* All Categories */}
                <CategoryChip
                  label="All"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  }
                  isSelected={selectedCategory === ''}
                  onClick={() => {
                    setSelectedCategory('');
                    setIsTransitioning(true);
                  }}
                />
                
                {/* Category Chips */}
                {displayCategories.slice(0, 10).map((category) => (
                  <CategoryChip
                    key={category}
                    label={category}
                    icon={CATEGORY_ICONS[category] || CATEGORY_ICONS['Vegetables']}
                    isSelected={selectedCategory === category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsTransitioning(true);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sort Menu */}
            <div className="w-full md:w-auto">
              <SortMenu selectedSort={sortOption} onSortChange={handleSortChange} />
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid with Fade Transition */}
        <AnimatePresence mode="wait">
          {loading && products.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </motion.div>
          ) : sortedProducts.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-24 h-24 mx-auto text-gray-300 mb-4"
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
              <p className="text-xl text-gray-500 font-medium">No products found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isTransitioning ? 0.5 : 1 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {sortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
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

        {/* Loading More Skeletons */}
        {loadingMore && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={`skeleton-${index}`} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Hide scrollbar for category row */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
