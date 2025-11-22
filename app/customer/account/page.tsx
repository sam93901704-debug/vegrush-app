'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../store/cartContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profilePic: string | null;
  phoneVerified: boolean;
}

interface Address {
  id: string;
  label: string | null;
  fullAddress: string;
  city: string | null;
  pincode: string | null;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  productId: string;
  qty: string;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  items: OrderItem[];
  address: Address;
}

export default function AccountPage() {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch user profile
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:4000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to load user profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    }
  };

  // Fetch user address
  const fetchAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/user/address', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddress(data.address);
      }
    } catch (err) {
      // Silent fail - address is optional
      console.debug('Failed to load address:', err);
    }
  };

  // Fetch user orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/orders?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      // Silent fail - orders are optional
      console.debug('Failed to load orders:', err);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUser(), fetchAddress(), fetchOrders()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    clearCart();
    router.push('/customer');
  };

  // Handle reorder
  const handleReorder = async (order: Order) => {
    try {
      setReordering(order.id);
      setError(null);
      
      // Clear cart first
      clearCart();

      // Fetch full order details to get complete product info
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:4000/api/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load order details');
      }

      const orderData = await response.json();

      // Fetch product details for each item and add to cart
      const productPromises = orderData.items.map(async (item: OrderItem) => {
        try {
          const productResponse = await fetch(
            `http://localhost:4000/api/products/${item.productId}`
          );
          
          if (productResponse.ok) {
            const product = await productResponse.json();
            // Add product to cart with the original quantity
            addItem(product, parseFloat(item.qty));
            return { success: true, productId: item.productId };
          } else {
            return { success: false, productId: item.productId, error: 'Product not found' };
          }
        } catch (err) {
          console.error(`Failed to fetch product ${item.productId}:`, err);
          return { success: false, productId: item.productId, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      });

      // Wait for all products to be fetched
      const results = await Promise.all(productPromises);
      const failedProducts = results.filter(r => !r.success);

      if (failedProducts.length > 0) {
        console.warn('Some products could not be added to cart:', failedProducts);
        // Still redirect to checkout if at least some products were added
      }

      // Small delay for better UX
      setTimeout(() => {
        setReordering(null);
        router.push('/customer/checkout');
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
      setReordering(null);
    }
  };

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      out_for_delivery: { bg: 'bg-purple-100', text: 'text-purple-800' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <button
            onClick={() => router.push('/customer')}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
            </div>
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Name</span>
                  <span className="text-sm text-gray-900">{user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Email</span>
                  <span className="text-sm text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Phone</span>
                  <span className="text-sm text-gray-900">
                    {user.phone || (
                      <button
                        onClick={() => router.push('/customer')}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Add Phone
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Address Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
            <motion.button
              onClick={() => router.push('/customer/account/address/edit')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {address ? 'Edit' : 'Add'}
            </motion.button>
          </div>
          {address ? (
            <div className="space-y-2">
              {address.label && (
                <p className="text-sm font-semibold text-gray-700">{address.label}</p>
              )}
              <p className="text-gray-900">{address.fullAddress}</p>
              {(address.city || address.pincode) && (
                <p className="text-sm text-gray-600">
                  {address.city}
                  {address.city && address.pincode && ' - '}
                  {address.pincode}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No address added yet</p>
          )}
        </motion.div>

        {/* Past Orders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Past Orders</h2>
            {orders.length > 0 && (
              <button
                onClick={() => router.push('/customer')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All
              </button>
            )}
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
              <p className="text-gray-500 mb-4">No orders yet</p>
              <button
                onClick={() => router.push('/customer')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.totalAmount + order.deliveryFee)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => router.push(`/customer/orders/${order.id}`)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        View
                      </motion.button>
                      <motion.button
                        onClick={() => handleReorder(order)}
                        disabled={reordering === order.id || order.status === 'cancelled'}
                        whileHover={reordering !== order.id ? { scale: 1.05 } : {}}
                        whileTap={reordering !== order.id ? { scale: 0.95 } : {}}
                        className={`px-3 py-1.5 text-sm rounded-lg transition font-medium ${
                          reordering === order.id || order.status === 'cancelled'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {reordering === order.id ? 'Adding...' : 'Reorder'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Support/FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Support & FAQ</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Need Help?</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Frequently Asked Questions</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Contact Support</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={() => setShowLogoutConfirm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition"
          >
            Logout
          </motion.button>
        </motion.div>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

