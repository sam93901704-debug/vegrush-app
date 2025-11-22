'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onQuantityChange?: (qty: number) => void;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  min = 1,
  max,
  onIncrement,
  onDecrement,
  onQuantityChange,
  disabled = false,
}: QuantitySelectorProps) {
  const canDecrement = quantity > min && !disabled;
  const canIncrement = quantity < max && !disabled;

  return (
    <div className="flex items-center gap-3">
      {/* Decrement Button */}
      <motion.button
        onClick={onDecrement}
        disabled={!canDecrement}
        whileHover={canDecrement ? { scale: 1.1 } : {}}
        whileTap={canDecrement ? { scale: 0.9 } : {}}
        className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center
          transition-all duration-300 font-bold text-lg
          ${
            canDecrement
              ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100 active:bg-green-200'
              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
          }
        `}
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
            d="M20 12H4"
          />
        </svg>
      </motion.button>

      {/* Quantity Display */}
      <motion.div
        key={quantity}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-w-[60px] text-center"
      >
        <span className="text-2xl font-bold text-gray-900">{quantity}</span>
      </motion.div>

      {/* Increment Button */}
      <motion.button
        onClick={onIncrement}
        disabled={!canIncrement}
        whileHover={canIncrement ? { scale: 1.1 } : {}}
        whileTap={canIncrement ? { scale: 0.9 } : {}}
        className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center
          transition-all duration-300 font-bold text-lg
          ${
            canIncrement
              ? 'bg-green-500 border-green-600 text-white hover:bg-green-600 active:bg-green-700 shadow-lg'
              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
          }
        `}
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </motion.button>
    </div>
  );
}

