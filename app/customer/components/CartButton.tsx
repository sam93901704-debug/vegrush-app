'use client';

import { useCart } from '../../store/cartContext';
import { useState } from 'react';
import CartDrawer from './CartDrawer';
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function CartButton() {
  const { getTotalItems, getTotalPrice } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemCount = getTotalItems();
  const totalPrice = getTotalPrice();

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(0)}`;
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/customer/checkout';
  };

  const hasItems = itemCount > 0;

  return (
    <>
      {/* Sticky Cart Button */}
      <AnimatePresence>
        {hasItems && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40
                     bg-gradient-to-r from-green-600 to-emerald-600 
                     text-white rounded-full shadow-2xl
                     px-6 py-4 flex items-center gap-3
                     hover:from-green-700 hover:to-emerald-700
                     transition-all duration-300"
            aria-label="Open cart"
          >
            {/* Cart Icon */}
            <div className="relative">
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
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </div>

            {/* Cart Info */}
            <div className="flex flex-col items-start">
              <span className="text-xs text-green-100">View Cart</span>
              <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
            </div>

            {/* Arrow */}
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCheckout={handleCheckout}
      />
    </>
  );
}

