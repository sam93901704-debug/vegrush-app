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
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const isInStock = parseFloat(product.stockQty) > 0;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-200 overflow-hidden cursor-pointer group transition-all duration-300"
    >
      {/* Product Image */}
      <div className="w-full aspect-square bg-slate-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              Out of Stock
            </span>
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-end justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-xl font-bold text-slate-900">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              per {product.unitValue} {product.unitType}
            </p>
          </div>
          {isInStock && (
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              In Stock
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
