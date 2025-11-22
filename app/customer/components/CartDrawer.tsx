'use client';

import { useCart } from '../../store/cartContext';
import { useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const DELIVERY_FEE = 50; // Delivery fee in rupees (5000 paise)

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, updateQty, removeItem, getTotalPrice, getTotalItems } = useCart();
  const [isClosing, setIsClosing] = useState(false);

  const subtotal = getTotalPrice() / 100; // Convert from paise to rupees
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleQuantityChange = (productId: string, currentQty: number, change: number) => {
    const newQty = Math.max(1, currentQty + change);
    updateQty(productId, newQty);
  };

  const formatPrice = (rupees: number) => {
    return `₹${rupees.toFixed(2)}`;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen && !isClosing
            ? 'translate-y-0'
            : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle Bar */}
        <div className="flex items-center justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Cart ({getTotalItems()})
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close cart"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <svg
                className="w-24 h-24 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-gray-500 text-lg font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-2">Add items to get started</p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {items.map((item) => {
                const unitValue = parseFloat(item.product.unitValue);
                const pricePerUnit = item.product.price / unitValue;
                const itemTotal = (pricePerUnit * item.qty) / 100;

                return (
                  <div
                    key={item.product.id}
                    className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.product.unitValue} {item.product.unitType}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {formatPrice(itemTotal)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.qty, -1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.qty <= 1}
                        >
                          <svg
                            className="w-4 h-4"
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
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-900">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.qty, 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                        >
                          <svg
                            className="w-4 h-4"
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
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Totals and Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            {/* Price Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg active:scale-98"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

