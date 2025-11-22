'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  assignedDeliveryId: string | null;
  user: {
    id: string;
    name: string;
    phone: string | null;
  };
  assignedDelivery?: {
    id: string;
    name: string;
    phone: string;
  };
  items: Array<{
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
  }>;
}

interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
}

interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface DeliveryBoysResponse {
  data: DeliveryBoy[];
}

const POLL_INTERVAL = 8000; // 8 seconds

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const params = new URLSearchParams();
      params.append('limit', '100'); // Fetch more orders for admin view
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(
        `${API_URL}/api/admin/orders?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data: OrdersResponse = await response.json();
      const newOrders = data.data || [];

      // Detect new orders (orders that weren't in previous fetch)
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

          // Remove highlight after 3 seconds
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const updated = new Set(prev);
              newOrderIdsSet.forEach((id) => updated.delete(id));
              return updated;
            });
          }, 3000);
        }
      }

      // Update previous order IDs
      previousOrderIdsRef.current = new Set(newOrders.map((o) => o.id));

      setOrders(newOrders);
    } catch (err) {
      // Don't show error on polling failures, only on initial load
      if (loading) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      }
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  }, [statusFilter, searchQuery, loading]);

  // Fetch delivery boys
  const fetchDeliveryBoys = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/delivery-boys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery boys');
      }

      const data: DeliveryBoysResponse = await response.json();
      setDeliveryBoys(data.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery boys:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
  }, [fetchOrders, fetchDeliveryBoys]);

  // Set up polling
  useEffect(() => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set up new interval (only start polling after initial load)
    if (!loading) {
      pollingIntervalRef.current = setInterval(() => {
        fetchOrders();
      }, POLL_INTERVAL);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loading, fetchOrders]);

  // Filter delivery boys based on search
  const filteredDeliveryBoys = deliveryBoys.filter((db) =>
    db.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
    db.phone.includes(assignSearchQuery) ||
    (db.vehicleNumber && db.vehicleNumber.toLowerCase().includes(assignSearchQuery.toLowerCase()))
  );

  // Format price
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  // Format status
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Optimistic status update
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Save previous state for rollback
    const previousOrders = [...orders];
    const previousStatus = orders.find((o) => o.id === orderId)?.status;

    // Optimistic update
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    setUpdatingStatus(orderId);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update order status');
      }

      // Refetch orders to get latest state
      await fetchOrders();
    } catch (err) {
      // Rollback on error
      setOrders(previousOrders);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Accept order (confirm pending order)
  const handleAccept = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
  };

  // Assign delivery boy
  const handleAssign = async (orderId: string, deliveryBoyId: string) => {
    const previousOrders = [...orders];
    const previousAssignedDeliveryId = orders.find((o) => o.id === orderId)?.assignedDeliveryId;

    // Optimistic update
    const selectedDeliveryBoy = deliveryBoys.find((db) => db.id === deliveryBoyId);
    if (selectedDeliveryBoy) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                assignedDeliveryId: deliveryBoyId,
                assignedDelivery: {
                  id: selectedDeliveryBoy.id,
                  name: selectedDeliveryBoy.name,
                  phone: selectedDeliveryBoy.phone,
                },
              }
            : order
        )
      );
    }

    setAssigningOrderId(orderId);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryBoyId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to assign delivery boy');
      }

      // Close modal
      setSelectedOrderId(null);
      setAssignSearchQuery('');

      // Refetch orders to get latest state
      await fetchOrders();
    } catch (err) {
      // Rollback on error
      setOrders(previousOrders);
      setError(err instanceof Error ? err.message : 'Failed to assign delivery boy');
    } finally {
      setAssigningOrderId(null);
    }
  };

  // Quick status buttons
  const handleQuickStatus = async (orderId: string, status: string) => {
    await updateOrderStatus(orderId, status);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">Manage and track all orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by order number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
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

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={newOrderIds.has(order.id) ? { scale: 0.95, opacity: 0 } : false}
                      animate={
                        newOrderIds.has(order.id)
                          ? {
                              scale: 1,
                              opacity: 1,
                              backgroundColor: ['#fef3c7', '#ffffff'],
                            }
                          : { backgroundColor: '#ffffff' }
                      }
                      exit={{ opacity: 0 }}
                      transition={{
                        backgroundColor: {
                          duration: 3,
                          repeat: newOrderIds.has(order.id) ? 2 : 0,
                        },
                      }}
                      className={`${
                        newOrderIds.has(order.id) ? 'bg-yellow-50' : ''
                      } hover:bg-gray-50`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.user.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(order.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.assignedDelivery?.name || (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </div>
                        {order.assignedDelivery?.phone && (
                          <div className="text-xs text-gray-500">
                            {order.assignedDelivery.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* View Button */}
                          <button
                            onClick={() => window.open(`/admin/orders/${order.id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900 transition"
                            title="View order details"
                          >
                            View
                          </button>

                          {/* Accept Button (only for pending orders) */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleAccept(order.id)}
                              disabled={updatingStatus === order.id}
                              className="text-green-600 hover:text-green-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Accept order"
                            >
                              {updatingStatus === order.id ? 'Accepting...' : 'Accept'}
                            </button>
                          )}

                          {/* Assign Button */}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setAssignSearchQuery('');
                              }}
                              className="text-purple-600 hover:text-purple-900 transition"
                              title="Assign delivery boy"
                            >
                              Assign
                            </button>
                          )}

                          {/* Quick Status Buttons */}
                          {order.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleQuickStatus(order.id, 'out_for_delivery')}
                                disabled={updatingStatus === order.id}
                                className="text-orange-600 hover:text-orange-900 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                title="Mark as out for delivery"
                              >
                                Out
                              </button>
                            </>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => handleQuickStatus(order.id, 'delivered')}
                              disabled={updatingStatus === order.id}
                              className="text-green-600 hover:text-green-900 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title="Mark as delivered"
                            >
                              Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {selectedOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => {
              setSelectedOrderId(null);
              setAssignSearchQuery('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Assign Delivery Boy
              </h2>

              {/* Search */}
              <input
                type="text"
                placeholder="Search delivery boys..."
                value={assignSearchQuery}
                onChange={(e) => setAssignSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              {/* Delivery Boys List */}
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {filteredDeliveryBoys.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No delivery boys found</p>
                ) : (
                  filteredDeliveryBoys.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => handleAssign(selectedOrderId, db.id)}
                      disabled={assigningOrderId === selectedOrderId}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">{db.name}</div>
                      <div className="text-sm text-gray-500">{db.phone}</div>
                      {db.vehicleNumber && (
                        <div className="text-xs text-gray-400">{db.vehicleNumber}</div>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedOrderId(null);
                  setAssignSearchQuery('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

