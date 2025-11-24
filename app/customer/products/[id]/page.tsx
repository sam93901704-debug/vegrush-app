'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../store/cartContext';
import { useProduct, useProducts } from '../../../hooks/useProducts';
import ProductCard from '../../components/ProductCard';
import QuantitySelector from './components/QuantitySelector';
import FreshnessTag from './components/FreshnessTag';
import NutritionalInfo from './components/NutritionalInfo';
import SimilarProductsCarousel from './components/SimilarProductsCarousel';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addItem } = useCart();

  const { data: product, isLoading, error } = useProduct(productId);
  const { data: relatedProductsData } = useProducts({
    category: product?.category,
    limit: 10,
  });

  const relatedProducts = (relatedProductsData?.data || []).filter((p) => p.id !== productId);

  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'g' | 'piece'>('kg');
  const [quantity, setQuantity] = useState<number>(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showAddAnimation, setShowAddAnimation] = useState(false);

  // Set selected unit when product loads
  useEffect(() => {
    if (product) {
      setSelectedUnit(product.unitType as 'kg' | 'g' | 'piece');
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      addItem(product, quantity);

      setShowAddAnimation(true);
      toast.success('Added to cart!');
      setTimeout(() => setShowAddAnimation(false), 1000);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-900 font-semibold mb-2">Product not found</p>
          <button
            onClick={() => router.push('/customer')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isInStock = parseFloat(product.stockQty) > 0;

  return (
    <motion.div
      className="min-h-screen bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-square bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <FreshnessTag />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                  {product.category}
                </span>
                {isInStock ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                    In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{product.name}</h1>
              {product.description && (
                <p className="text-slate-600 leading-relaxed">{product.description}</p>
              )}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                <span className="text-slate-500">per {product.unitValue} {product.unitType}</span>
              </div>

              <QuantitySelector
                quantity={quantity}
                max={parseFloat(product.stockQty)}
                onIncrement={() => setQuantity((q) => Math.min(q + 1, parseFloat(product.stockQty)))}
                onDecrement={() => setQuantity((q) => Math.max(q - 1, 1))}
                onQuantityChange={setQuantity}
                disabled={!isInStock}
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || addingToCart}
                className="w-full px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
              >
                {addingToCart ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>

              <AnimatePresence>
                {showAddAnimation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center text-emerald-600 font-medium"
                  >
                    ✓ Added to cart!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NutritionalInfo category={product.category} />
          </motion.div>
        </div>

        {/* Similar Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Similar Products</h2>
            <SimilarProductsCarousel
              products={relatedProducts}
              onProductClick={(productId) => router.push(`/customer/products/${productId}`)}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
