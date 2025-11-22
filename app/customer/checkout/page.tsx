'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../store/cartContext';
import { API_URL } from '../../config/api';

interface Address {
  id: string;
  label: string | null;
  fullAddress: string;
  city: string | null;
  pincode: string | null;
  isDefault: boolean;
}

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

const DELIVERY_FEE = 50; // Delivery fee in rupees (5000 paise)

type PaymentMethod = 'cash_on_delivery' | 'qr_on_delivery';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');

  // Fetch default address
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to continue');
          return;
        }

        // Get user's default address
        const addressResponse = await fetch(`${API_URL}/api/user/address`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!addressResponse.ok) {
          if (addressResponse.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error('Failed to load address');
        }

        const data = await addressResponse.json();
        setAddress(data.address);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load address');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, []);

  const subtotal = getTotalPrice() / 100; // Convert from paise to rupees
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const formatPrice = (rupees: number) => {
    return `₹${rupees.toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!address) {
      setError('Please add a delivery address');
      return;
    }

    setPlacingOrder(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare order items
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
      }));

      // Create order
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          addressId: address.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const order = await response.json();

      // Clear cart
      clearCart();

      // Small delay for better UX before redirect
      setTimeout(() => {
        // Redirect to order tracking screen
        router.push(`/customer/orders/${order.id}`);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Delivery Address
              </h2>
              {address ? (
                <div className="space-y-2">
                  {address.label && (
                    <p className="text-sm font-medium text-gray-500">
                      {address.label}
                    </p>
                  )}
                  <p className="text-gray-900">{address.fullAddress}</p>
                  {address.city && (
                    <p className="text-gray-600">
                      {address.city}
                      {address.pincode && ` - ${address.pincode}`}
                    </p>
                  )}
                  {address.isDefault && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      Default
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No delivery address found</p>
                  <button
                    onClick={() => router.push('/customer/profile')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Payment Method
              </h2>
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">
                        Cash on Delivery
                      </span>
                      {paymentMethod === 'cash_on_delivery' && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Pay with cash when your order arrives
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </motion.label>

                {/* QR on Delivery */}
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'qr_on_delivery'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="qr_on_delivery"
                    checked={paymentMethod === 'qr_on_delivery'}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">
                        QR on Delivery
                      </span>
                      {paymentMethod === 'qr_on_delivery' && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Scan QR code to pay when your order arrives
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          The delivery agent will show you a QR code. You can
                          pay using any UPI app or payment wallet.
                        </span>
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </motion.label>
              </div>
            </motion.div>

            {/* Delivery Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Delivery Instructions
              </h2>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Add special instructions for the delivery agent (e.g., 'Call before delivery', 'Leave at door', 'Ring the doorbell twice')"
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2 text-right">
                {deliveryInstructions.length}/500 characters
              </p>
            </motion.div>

            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Items ({items.length})
              </h2>
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Your cart is empty</p>
                  <button
                    onClick={() => router.push('/customer')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
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
                          <h3 className="text-base font-semibold text-gray-900">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.product.unitValue} {item.product.unitType} × {item.qty}
                          </p>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            {formatPrice(itemTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-4 border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Delivery Time Estimate */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-green-800">
                    Estimated Delivery
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  20-30 minutes
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Fast delivery guaranteed
                </p>
              </motion.div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 border-b border-gray-200 pb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button with Enhanced Loader */}
              <motion.button
                onClick={handlePlaceOrder}
                disabled={placingOrder || items.length === 0 || !address}
                whileHover={
                  !placingOrder && items.length > 0 && address
                    ? { scale: 1.02 }
                    : {}
                }
                whileTap={
                  !placingOrder && items.length > 0 && address
                    ? { scale: 0.98 }
                    : {}
                }
                animate={
                  placingOrder
                    ? {
                        scale: [1, 1.02, 1],
                      }
                    : {}
                }
                transition={
                  placingOrder
                    ? {
                        scale: {
                          duration: 1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }
                    : { duration: 0.2 }
                }
                className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {placingOrder ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-3"
                    >
                      {/* Animated Spinner */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
                      ></motion.div>
                      <span>Placing Order...</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="text"
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Place Order
                    </motion.span>
                  )}
                </AnimatePresence>

              </motion.button>

              {(!address || items.length === 0) && (
                <p className="mt-3 text-sm text-gray-500 text-center">
                  {!address
                    ? 'Please add a delivery address'
                    : 'Add items to your cart'}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

