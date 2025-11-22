'use client';

import { motion } from 'framer-motion';

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

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  // Format price (paise to rupees)
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  // Check if product is in stock
  const isInStock = parseFloat(product.stockQty) > 0;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 group"
    >
      {/* Product Image */}
      <div className="w-full h-52 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              className="w-20 h-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {!isInStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-end justify-between pt-2 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              per {product.unitValue} {product.unitType}
            </p>
          </div>
          {isInStock && (
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ In Stock
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

