'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../../config/api';

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
  isDefault: boolean;
}

interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  assignedDeliveryId: string | null;
  pickedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user: User;
  address: Address;
  assignedDelivery?: DeliveryBoy | null;
}

interface DeliveryBoysResponse {
  data: DeliveryBoy[];
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      const orderData: Order = await response.json();
      setOrder(orderData);
      setSelectedDeliveryBoyId(orderData.assignedDeliveryId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

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

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchDeliveryBoys();
    }
  }, [orderId, fetchOrder, fetchDeliveryBoys]);

  // Filter delivery boys based on search
  const filteredDeliveryBoys = deliveryBoys.filter(
    (db) =>
      db.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
      db.phone.includes(assignSearchQuery) ||
      (db.vehicleNumber &&
        db.vehicleNumber.toLowerCase().includes(assignSearchQuery.toLowerCase()))
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

  // Generate Google Maps link
  const getMapLink = () => {
    if (!order?.address) return '';
    const address = encodeURIComponent(order.address.fullAddress);
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  };

  // Handle call
  const handleCall = (phone: string | null) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  // Handle assign & notify
  const handleAssignAndNotify = async () => {
    if (!selectedDeliveryBoyId || !order) return;

    setAssigning(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryBoyId: selectedDeliveryBoyId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to assign delivery boy');
      }

      // Refresh order data
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign delivery boy');
    } finally {
      setAssigning(false);
    }
  };

  // Get action log entries
  const getActionLog = () => {
    if (!order) return [];

    const log: Array<{ label: string; timestamp: string | null }> = [];

    log.push({
      label: 'Order Placed',
      timestamp: order.createdAt,
    });

    if (order.pickedAt) {
      log.push({
        label: 'Picked Up',
        timestamp: order.pickedAt,
      });
    }

    if (order.outForDeliveryAt) {
      log.push({
        label: 'Out for Delivery',
        timestamp: order.outForDeliveryAt,
      });
    }

    if (order.deliveredAt) {
      log.push({
        label: 'Delivered',
        timestamp: order.deliveredAt,
      });
    }

    return log;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Order not found'}
        </div>
        <button
          onClick={() => router.push('/admin/orders')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const actionLog = getActionLog();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin/orders')}
            className="mb-2 flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
        </div>
        <span
          className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
            order.status
          )}`}
        >
          {formatStatus(order.status)}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-semibold text-gray-900">{order.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg text-gray-900">{order.user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg text-gray-900">{order.user.phone || 'N/A'}</p>
                </div>
                {order.user.phone && (
                  <button
                    onClick={() => handleCall(order.user.phone)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
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
                    Call
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
            <div className="space-y-2">
              <p className="text-gray-900">{order.address.fullAddress}</p>
              {(order.address.city || order.address.pincode) && (
                <p className="text-gray-600">
                  {order.address.city}
                  {order.address.city && order.address.pincode && ' - '}
                  {order.address.pincode}
                </p>
              )}
              <a
                href={getMapLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition mt-2"
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
                Open in Maps
              </a>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">{item.product.category}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {parseFloat(item.qty).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.unitPrice)} × {parseFloat(item.qty).toFixed(2)}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>{formatPrice(order.totalAmount - order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery Fee:</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Payment Method: <span className="font-semibold">{order.paymentMethod}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Log */}
        <div className="lg:col-span-1 space-y-6">
          {/* Assign Delivery Boy */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Delivery Boy</h2>
            <div className="space-y-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search delivery boys..."
                value={assignSearchQuery}
                onChange={(e) => setAssignSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Delivery Boys List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredDeliveryBoys.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">
                    No delivery boys found
                  </p>
                ) : (
                  filteredDeliveryBoys.map((db) => (
                    <label
                      key={db.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        selectedDeliveryBoyId === db.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryBoy"
                        value={db.id}
                        checked={selectedDeliveryBoyId === db.id}
                        onChange={() => setSelectedDeliveryBoyId(db.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{db.name}</div>
                        <div className="text-sm text-gray-600">{db.phone}</div>
                        {db.vehicleNumber && (
                          <div className="text-xs text-gray-500">{db.vehicleNumber}</div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Currently Assigned */}
              {order.assignedDelivery && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600">Currently Assigned:</p>
                  <p className="font-semibold text-gray-900">{order.assignedDelivery.name}</p>
                  <p className="text-sm text-gray-600">{order.assignedDelivery.phone}</p>
                </div>
              )}

              {/* Assign Button */}
              <button
                onClick={handleAssignAndNotify}
                disabled={!selectedDeliveryBoyId || assigning}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {assigning
                  ? 'Assigning...'
                  : selectedDeliveryBoyId === order.assignedDeliveryId
                  ? 'Re-assign & Notify'
                  : 'Assign & Notify'}
              </button>
            </div>
          </div>

          {/* Action Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Action Log</h2>
            <div className="space-y-4">
              {actionLog.map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index < actionLog.length - 1
                          ? 'bg-blue-500'
                          : entry.timestamp
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    {index < actionLog.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-gray-900">{entry.label}</p>
                    {entry.timestamp ? (
                      <p className="text-sm text-gray-600">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

