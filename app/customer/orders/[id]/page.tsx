'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderStatusTracker from './components/OrderStatusTracker';

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

interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  status: string;
  assignedDeliveryId: string | null;
  pickedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: Address & {
    latitude?: string | number;
    longitude?: string | number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedDelivery?: DeliveryBoy | null;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      const orderData: Order = await response.json();

      // Check if status changed for animation
      if (previousStatus && previousStatus !== orderData.status) {
        // Status changed - trigger animation
        setPreviousStatus(orderData.status);
      } else if (!previousStatus) {
        // First load
        setPreviousStatus(orderData.status);
      }

      setOrder(orderData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Poll order status every 10 seconds
  useEffect(() => {
    if (!orderId || loading) return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [orderId, loading]);

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Order not found'}
          </h1>
          <button
            onClick={() => router.push('/customer')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = order.totalAmount + order.deliveryFee;
  const statusChanged = previousStatus && previousStatus !== order.status;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition"
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
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-500 mt-1">Order #{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Placed on</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Status Tracker */}
        <div className="mb-6">
          <OrderStatusTracker
            status={order.status}
            createdAt={order.createdAt}
            pickedAt={order.pickedAt}
            outForDeliveryAt={order.outForDeliveryAt}
            deliveredAt={order.deliveredAt}
            assignedDelivery={order.assignedDelivery}
            address={order.address}
            onStatusChanged={(newStatus) => {
              // Status changed - trigger refresh animation
              setPreviousStatus(newStatus);
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const itemTotal = item.subtotal / 100; // Convert from paise to rupees
                  return (
                    <div
                      key={item.id}
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
                          {item.product.category}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Quantity: {item.qty}
                        </p>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Delivery Address
              </h2>
              <div className="space-y-2">
                {order.address.label && (
                  <p className="text-sm font-medium text-gray-500">
                    {order.address.label}
                  </p>
                )}
                <p className="text-gray-900">{order.address.fullAddress}</p>
                {order.address.city && (
                  <p className="text-gray-600">
                    {order.address.city}
                    {order.address.pincode && ` - ${order.address.pincode}`}
                  </p>
                )}
                {order.address.isDefault && (
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    Default Address
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                <p className="text-base font-medium text-gray-900 capitalize">
                  {order.paymentMethod.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

