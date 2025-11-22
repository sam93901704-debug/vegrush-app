'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PendingSyncBadge from '../components/PendingSyncBadge';
import { API_URL } from '@/config/api';

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

interface Address {
  id: string;
  label: string | null;
  fullAddress: string;
  city: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: Address;
  user: User;
}

interface OrdersResponse {
  data: Order[];
}

const POLL_INTERVAL = 10000; // 10 seconds

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingDelivery, setStartingDelivery] = useState<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/delivery/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          router.push('/auth/login');
          return;
        }
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data: OrdersResponse = await response.json();
      const newOrders = data.data || [];

      // Detect new orders
      if (previousOrderIdsRef.current.size > 0) {
        const currentOrderIds = new Set(newOrders.map((o) => o.id));
        const newOrderIdsSet = new Set<string>();

        newOrders.forEach((order) => {
          if (!previousOrderIdsRef.current.has(order.id)) {
            newOrderIdsSet.add(order.id);
          }
        });

        if (newOrderIdsSet.size > 0) {
          setNewOrderIds(newOrderIdsSet);

          // Remove highlight after 5 seconds
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const updated = new Set(prev);
              newOrderIdsSet.forEach((id) => updated.delete(id));
              return updated;
            });
          }, 5000);
        }
      }

      // Update previous order IDs
      previousOrderIdsRef.current = new Set(newOrders.map((o) => o.id));

      setOrders(newOrders);
    } catch (err) {
      if (loading) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      }
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  }, [loading, router]);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Set up polling
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    if (!loading) {
      pollingIntervalRef.current = setInterval(() => {
        fetchOrders();
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loading, fetchOrders]);

  // Format price
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  // Get item summary
  const getItemSummary = (items: OrderItem[]) => {
    if (items.length === 0) return 'No items';
    if (items.length === 1) return items[0].product.name;
    return `${items[0].product.name} + ${items.length - 1} more`;
  };

  // Get distance (placeholder - would be calculated based on current location)
  const getDistance = (order: Order): string => {
    // Placeholder - in real app, calculate based on current location and order address
    // For now, return placeholder or saved approximate distance
    return '~5.2 km'; // Placeholder
  };

  // Get ETA (placeholder)
  const getETA = (order: Order): string => {
    // Placeholder - in real app, calculate based on distance and traffic
    return '~15 min'; // Placeholder
  };

  // Check if order is new/urgent
  const isNewOrder = (order: Order): boolean => {
    // Consider orders created within last 10 minutes as new
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes < 10;
  };

  // Handle navigate to Google Maps
  const handleNavigate = (order: Order) => {
    if (!order.address.latitude || !order.address.longitude) {
      // Fallback to address search if lat/lng not available
      const address = encodeURIComponent(order.address.fullAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
      return;
    }

    // Deep link to Google Maps with lat/lng
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`,
      '_blank'
    );
  };

  // Handle call customer
  const handleCall = (phone: string | null) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  // Handle start delivery
  const handleStartDelivery = async (order: Order) => {
    if (startingDelivery === order.id) return;

    setStartingDelivery(order.id);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Determine status based on current status
      // If confirmed, set to picked, then out_for_delivery
      // If already picked, set to out_for_delivery
      let nextStatus = 'out_for_delivery';
      if (order.status === 'confirmed') {
        nextStatus = 'picked';
      }

      const response = await fetch(
        `${API_URL}/api/delivery/orders/${order.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to start delivery');
      }

      // If we set to 'picked', immediately update to 'out_for_delivery'
      if (nextStatus === 'picked') {
        setTimeout(async () => {
          try {
            const updateResponse = await fetch(
              `${API_URL}/api/delivery/orders/${order.id}/status`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'out_for_delivery' }),
              }
            );

            if (updateResponse.ok) {
              // Refresh orders
              await fetchOrders();
            }
          } catch (err) {
            console.error('Failed to update to out_for_delivery:', err);
          }
        }, 500);
      }

      // Refresh orders
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start delivery');
    } finally {
      setStartingDelivery(null);
    }
  };

  // Handle view details
  const handleViewDetails = (orderId: string) => {
    router.push(`/delivery/orders/${orderId}`);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assigned Orders</h1>
            <p className="text-gray-600">Orders assigned to you for delivery</p>
          </div>
          <PendingSyncBadge showDetails />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-600 text-lg">No orders assigned</p>
          <p className="text-gray-500 text-sm mt-2">
            New orders will appear here when assigned to you
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={
                  newOrderIds.has(order.id)
                    ? { scale: 0.95, opacity: 0, y: 20 }
                    : { opacity: 1 }
                }
                animate={
                  newOrderIds.has(order.id)
                    ? {
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        backgroundColor: ['#fef3c7', '#ffffff'],
                      }
                    : { backgroundColor: '#ffffff' }
                }
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  backgroundColor: {
                    duration: 5,
                    repeat: newOrderIds.has(order.id) ? 1 : 0,
                  },
                }}
                className={`bg-white rounded-lg shadow-md p-6 ${
                  newOrderIds.has(order.id) ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {/* Header with Order Number and Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      Order {order.orderNumber}
                    </h2>
                    {isNewOrder(order) && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full animate-pulse">
                        NEW
                      </span>
                    )}
                    {newOrderIds.has(order.id) && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {order.status === 'confirmed' ? 'Confirmed' : 'Out for Delivery'}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-900">{order.user.name}</p>
                  <p className="text-sm text-gray-600">{order.address.fullAddress}</p>
                  {(order.address.city || order.address.pincode) && (
                    <p className="text-sm text-gray-500">
                      {order.address.city}
                      {order.address.city && order.address.pincode && ' - '}
                      {order.address.pincode}
                    </p>
                  )}
                </div>

                {/* Item Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Items</p>
                  <p className="font-medium text-gray-900">{getItemSummary(order.items)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>

                {/* Distance and ETA */}
                <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
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
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    <span>{getDistance(order)}</span>
                  </div>
                  <div className="flex items-center gap-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>ETA: {getETA(order)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  {/* Primary Action - Start Delivery */}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleStartDelivery(order)}
                      disabled={startingDelivery === order.id}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                      {startingDelivery === order.id ? (
                        <span className="flex items-center justify-center gap-2">
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
                          Starting...
                        </span>
                      ) : (
                        'Start Delivery'
                      )}
                    </button>
                  )}

                  {/* Secondary Actions */}
                  <div className="flex gap-2">
                    {/* Navigate Button */}
                    <button
                      onClick={() => handleNavigate(order)}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                      title="Navigate to address"
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
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <span className="hidden sm:inline">Navigate</span>
                    </button>

                    {/* Call Button */}
                    {order.user.phone && (
                      <button
                        onClick={() => handleCall(order.user.phone)}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                        title="Call customer"
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="hidden sm:inline">Call</span>
                      </button>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(order.id)}
                      className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                      title="View order details"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Details</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

