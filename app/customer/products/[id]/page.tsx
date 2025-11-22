'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../store/cartContext';
import { useParallax } from '../../../hooks/useParallax';
import ProductCard from '../../components/ProductCard';
import QuantitySelector from './components/QuantitySelector';
import FreshnessTag from './components/FreshnessTag';
import { API_URL } from '@/config/api';
import NutritionalInfo from './components/NutritionalInfo';
import SimilarProductsCarousel from './components/SimilarProductsCarousel';

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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'g' | 'piece'>('kg');
  const [quantity, setQuantity] = useState<number>(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  
  // Refs for parallax effect
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useParallax(imageRef);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_URL}/api/products/${productId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error(`Failed to fetch product: ${response.statusText}`);
        }

        const productData: Product = await response.json();
        setProduct(productData);
        setSelectedUnit(productData.unitType as 'kg' | 'g' | 'piece');

        // Fetch related products (same category, exclude current product)
        const relatedResponse = await fetch(
          `${API_URL}/api/products?category=${encodeURIComponent(
            productData.category
          )}&limit=10`
        );

        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          const filtered = (relatedData.data || []).filter(
            (p: Product) => p.id !== productId && p.isActive
          );
          setRelatedProducts(filtered.slice(0, 10)); // Show more for carousel
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Format price (paise to rupees)
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  // Calculate price per unit (in base unit)
  const calculatePricePerUnit = () => {
    if (!product) return 0;
    const baseUnitValue = parseFloat(product.unitValue);
    return product.price / baseUnitValue; // Price per 1 unit in paise
  };

  // Calculate price based on quantity and selected unit
  const calculatePrice = () => {
    if (!product) return 0;

    const baseUnitValue = parseFloat(product.unitValue);
    const basePrice = product.price; // price in paise for baseUnitValue
    const pricePerUnit = basePrice / baseUnitValue;

    // If unit types match, simple calculation
    if (product.unitType === selectedUnit) {
      return pricePerUnit * quantity;
    }

    // Convert between kg and g
    if (product.unitType === 'kg' && selectedUnit === 'g') {
      // Product is in kg, user wants g
      // 1 kg = 1000 g, so price per g = (price per kg) / 1000
      return (pricePerUnit / 1000) * quantity;
    } else if (product.unitType === 'g' && selectedUnit === 'kg') {
      // Product is in g, user wants kg
      // 1 kg = 1000 g, so price per kg = (price per g) * 1000
      return (pricePerUnit * 1000) * quantity;
    }

    // Default: same unit type
    return pricePerUnit * quantity;
  };

  // Get price per selected unit
  const getPricePerSelectedUnit = () => {
    if (!product) return 0;
    const pricePerBaseUnit = calculatePricePerUnit();
    
    if (product.unitType === selectedUnit) {
      return pricePerBaseUnit;
    }
    
    if (product.unitType === 'kg' && selectedUnit === 'g') {
      return pricePerBaseUnit / 1000;
    } else if (product.unitType === 'g' && selectedUnit === 'kg') {
      return pricePerBaseUnit * 1000;
    }
    
    return pricePerBaseUnit;
  };

  // Check if product is in stock
  const isInStock = product ? parseFloat(product.stockQty) > 0 : false;

  // Handle quantity increment
  const handleIncrement = () => {
    const maxStock = product ? parseFloat(product.stockQty) : 0;
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  };

  // Handle quantity decrement
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Handle add to cart with pop animation
  const handleAddToCart = () => {
    if (!product || !isInStock) return;

    setAddingToCart(true);
    setShowAddAnimation(true);

    try {
      // Use cart context to add item
      addItem(product, quantity);

      // Reset after animation
      setTimeout(() => {
        setShowAddAnimation(false);
        setAddingToCart(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setShowAddAnimation(false);
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Product not found'}
          </h1>
          <button
            onClick={() => router.push('/customer')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = calculatePrice();
  const pricePerSelectedUnit = getPricePerSelectedUnit();
  const parallaxOffset = Math.min(scrollY * 0.3, 100); // Max 100px offset
  const zoomScale = 1 + Math.min(scrollY * 0.0005, 0.1); // Max 10% zoom

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Parallax Hero Image */}
      <div
        ref={imageRef}
        className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50"
      >
        <motion.div
          style={{
            y: parallaxOffset,
            scale: zoomScale,
          }}
          className="absolute inset-0 w-full h-full"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-32 h-32 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>
          {!isInStock && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
              <span className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-xl">
                Out of Stock
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-24 relative z-10">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-6 flex items-center gap-2 px-4 py-2 
                   bg-white/90 backdrop-blur-sm rounded-full shadow-md
                   text-gray-700 hover:text-gray-900 
                   transition-all duration-300 font-medium"
        >
          <svg
            className="w-5 h-5"
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
          Back
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border border-gray-100"
          >
            {/* Name, Category, and Freshness Tag */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex-1">
                  {product.name}
                </h1>
                <FreshnessTag isFresh={isInStock} />
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-semibold border border-green-200">
                  {product.category}
                </span>
                {isInStock && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 text-lg leading-relaxed"
              >
                {product.description}
              </motion.p>
            )}

            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100"
            >
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl md:text-5xl font-bold text-gray-900">
                    {formatPrice(totalPrice)}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    total
                  </span>
                </div>
                <div className="border-t border-green-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Per {selectedUnit}:
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {formatPrice(pricePerSelectedUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Quantity:
                    </span>
                    <span className="text-base font-semibold text-gray-700">
                      {quantity} {selectedUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="text-xs text-gray-500">
                      Base price: {formatPrice(product.price)} per {product.unitValue} {product.unitType}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Unit Selector */}
            {(product.unitType === 'kg' || product.unitType === 'g') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Unit
                </label>
                <div className="flex gap-3">
                  {['kg', 'g'].map((unit) => (
                    <motion.button
                      key={unit}
                      onClick={() => setSelectedUnit(unit as 'kg' | 'g')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        selectedUnit === unit
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {unit.toUpperCase()}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Animated Quantity Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <QuantitySelector
                  quantity={quantity}
                  min={1}
                  max={parseFloat(product.stockQty)}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  disabled={!isInStock}
                />
                <span className="text-sm text-gray-500 font-medium">
                  Max: {parseFloat(product.stockQty).toFixed(2)}{' '}
                  {product.unitType} available
                </span>
              </div>
            </motion.div>

            {/* Add to Cart Button with Pop Animation */}
            <motion.button
              onClick={handleAddToCart}
              disabled={!isInStock || addingToCart}
              whileHover={!addingToCart && isInStock ? { scale: 1.02 } : {}}
              whileTap={!addingToCart && isInStock ? { scale: 0.98 } : {}}
              animate={
                showAddAnimation
                  ? {
                      scale: [1, 1.1, 1],
                      backgroundColor: ['#16a34a', '#10b981'],
                    }
                  : {}
              }
              transition={
                showAddAnimation
                  ? {
                      duration: 0.6,
                      times: [0, 0.3, 1],
                    }
                  : { duration: 0.2 }
              }
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg 
                       transition-all duration-300 text-white shadow-lg
                       ${
                         showAddAnimation
                           ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                           : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                       }
                       ${
                         !isInStock || addingToCart
                           ? 'opacity-50 cursor-not-allowed'
                           : 'hover:shadow-xl'
                       }`}
            >
              <AnimatePresence mode="wait">
                {addingToCart ? (
                  <motion.span
                    key="adding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <svg
                      className="animate-spin h-5 w-5"
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
                    Adding...
                  </motion.span>
                ) : showAddAnimation ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Added to Cart!
                  </motion.span>
                ) : !isInStock ? (
                  <span key="out-of-stock">Out of Stock</span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {/* Nutritional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <NutritionalInfo category={product.category} />
          </motion.div>
        </div>

        {/* Similar Products Carousel */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Similar Products
              </h2>
              <span className="text-sm text-gray-500 font-medium">
                {relatedProducts.length} items
              </span>
            </div>
            <SimilarProductsCarousel
              products={relatedProducts}
              onProductClick={(productId) =>
                router.push(`/customer/products/${productId}`)
              }
            />
          </motion.div>
        )}
      </div>

      {/* Hide scrollbar for carousel */}
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

