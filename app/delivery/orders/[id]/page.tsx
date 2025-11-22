'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineQueue } from '../../utils/offlineQueue';
import PendingSyncBadge from '../../components/PendingSyncBadge';
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
    price: number;
    unitType: string;
    unitValue: string;
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
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  pickedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  address: Address;
  user: User;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const POLL_INTERVAL = 5000; // 5 seconds for detail page

export default function DeliveryOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'cod' | 'qr' | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState<string | null>(null);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/delivery/orders/${orderId}`, {
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
        if (response.status === 403) {
          setError('This order is not assigned to you');
          return;
        }
        if (response.status === 404) {
          setError('Order not found');
          return;
        }
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      const orderData: Order = await response.json();
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  }, [orderId, router, loading]);

  // Initial load
  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  // Set up polling
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    if (!loading && orderId) {
      pollingIntervalRef.current = setInterval(() => {
        fetchOrder();
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loading, orderId, fetchOrder]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Format price
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  // Get Google Maps embed URL (using static map or iframe without API key)
  const getMapEmbedUrl = () => {
    if (!order?.address) return '';
    // Use Google Maps iframe embed (works without API key for basic usage)
    if (order.address.latitude && order.address.longitude) {
      return `https://www.google.com/maps?q=${order.address.latitude},${order.address.longitude}&output=embed`;
    }
    const address = encodeURIComponent(order.address.fullAddress);
    return `https://www.google.com/maps?q=${address}&output=embed`;
  };

  // Handle status update with offline queue support
  const handleStatusUpdate = async (newStatus: string, paymentType?: 'cod' | 'qr') => {
    if (!order || updatingStatus) return;

    setUpdatingStatus(newStatus);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setUpdatingStatus(null);
      return;
    }

    const url = `${API_URL}/api/delivery/orders/${order.id}/status`;
    const body: { status: string; paymentType?: string } = { status: newStatus };
    if (paymentType) {
      body.paymentType = paymentType;
    }
    
    const requestData = {
      url,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body,
    };

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update order status');
      }

      const updatedOrder: Order = await response.json();
      setOrder(updatedOrder);

      // Show success toast
      const statusMessages: Record<string, string> = {
        picked: 'Order marked as picked',
        out_for_delivery: 'Order marked as out for delivery',
        delivered: 'Order delivered successfully!',
      };
      showToast(statusMessages[newStatus] || 'Order status updated');

      // If delivered, close all modals
      if (newStatus === 'delivered') {
        setShowDeliverModal(false);
        setShowPaymentConfirmation(false);
        setDeliveryPhoto(null);
        setDeliveryPhotoPreview(null);
        setSignatureConfirmed(false);
        setSelectedPaymentType(null);
      }
    } catch (err) {
      // Check if it's a network error
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      
      if (isNetworkError || !navigator.onLine) {
        // Queue the request for retry
        await offlineQueue.queueRequest(requestData);
        
        // Optimistically update the UI
        const statusMessages: Record<string, string> = {
          picked: 'Order marked as picked (will sync when online)',
          out_for_delivery: 'Order marked as out for delivery (will sync when online)',
          delivered: 'Order marked as delivered (will sync when online)',
        };
        showToast(statusMessages[newStatus] || 'Order status updated (will sync when online)', 'success');
        
        // Update order status optimistically
        setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        
        // If delivered, close all modals
        if (newStatus === 'delivered') {
          setShowDeliverModal(false);
          setShowPaymentConfirmation(false);
          setDeliveryPhoto(null);
          setDeliveryPhotoPreview(null);
          setSignatureConfirmed(false);
          setSelectedPaymentType(null);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle picked
  const handlePicked = () => {
    handleStatusUpdate('picked');
  };

  // Handle out for delivery
  const handleOutForDelivery = () => {
    handleStatusUpdate('out_for_delivery');
  };

  // Handle deliver button click
  const handleDeliverClick = () => {
    setShowDeliverModal(true);
  };

  // Handle deliver confirmation (after signature/photo)
  const handleDeliverConfirm = async () => {
    if (!signatureConfirmed) {
      showToast('Please confirm customer signature', 'error');
      return;
    }

    // Upload photo if provided
    if (deliveryPhoto) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const formData = new FormData();
        formData.append('image', deliveryPhoto);

        const uploadResponse = await fetch(`${API_URL}/api/admin/upload-product-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.warn('Failed to upload delivery photo');
        } else {
          const uploadData = await uploadResponse.json();
          console.log('Delivery photo uploaded:', uploadData.url);
          // TODO: Save delivery photo URL to order in database
        }
      } catch (err) {
        console.error('Failed to upload delivery photo:', err);
        // Continue with delivery even if photo upload fails
      }
    }

    // Close signature modal and show payment confirmation
    setShowDeliverModal(false);
    setShowPaymentConfirmation(true);
  };

  // Handle payment type selection and final delivery
  const handlePaymentTypeSelect = async (paymentType: 'cod' | 'qr') => {
    if (!order) return;

    setSelectedPaymentType(paymentType);
    
    // Update status to delivered with payment type
    await handleStatusUpdate('delivered', paymentType);
    
    // Close payment confirmation modal
    setShowPaymentConfirmation(false);
    setSelectedPaymentType(null);
    
    // Reset delivery modal state
    setDeliveryPhoto(null);
    setDeliveryPhotoPreview(null);
    setSignatureConfirmed(false);
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      setDeliveryPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle navigate
  const handleNavigate = () => {
    if (!order?.address) return;

    if (order.address.latitude && order.address.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`,
        '_blank'
      );
    } else {
      const address = encodeURIComponent(order.address.fullAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  // Handle call
  const handleCall = () => {
    if (!order?.user?.phone) return;
    window.location.href = `tel:${order.user.phone}`;
  };

  // Check if status allows action
  const canMarkPicked = order?.status === 'confirmed';
  const canMarkOutForDelivery = order?.status === 'picked' || order?.status === 'confirmed';
  const canMarkDelivered = order?.status === 'out_for_delivery';

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => router.push('/delivery/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/delivery/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition"
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
          <PendingSyncBadge />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
            {order.status === 'confirmed'
              ? 'Confirmed'
              : order.status === 'picked'
              ? 'Picked'
              : order.status === 'out_for_delivery'
              ? 'Out for Delivery'
              : order.status === 'delivered'
              ? 'Delivered'
              : order.status}
          </span>
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

      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
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
                    onClick={handleCall}
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
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 mb-1">{order.address.fullAddress}</p>
                {(order.address.city || order.address.pincode) && (
                  <p className="text-gray-600">
                    {order.address.city}
                    {order.address.city && order.address.pincode && ' - '}
                    {order.address.pincode}
                  </p>
                )}
              </div>

              {/* Map Preview */}
              <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={getMapEmbedUrl()}
                ></iframe>
              </div>

              {/* Navigate Button */}
              <button
                onClick={handleNavigate}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
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
                Navigate to Address
              </button>
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
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">{item.product.category}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {parseFloat(item.qty).toFixed(2)} {item.product.unitType}
                    </p>
                    <p className="text-sm text-gray-600">
                      Unit Price: {formatPrice(item.unitPrice)} / {item.product.unitValue}{' '}
                      {item.product.unitType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
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

        {/* Action Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Actions */}
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {/* Picked Button */}
              {canMarkPicked && (
                <button
                  onClick={handlePicked}
                  disabled={updatingStatus !== null}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {updatingStatus === 'picked' ? 'Marking...' : 'Mark as Picked'}
                </button>
              )}

              {/* Out for Delivery Button */}
              {canMarkOutForDelivery && (
                <button
                  onClick={handleOutForDelivery}
                  disabled={updatingStatus !== null || order.status === 'out_for_delivery'}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {updatingStatus === 'out_for_delivery'
                    ? 'Updating...'
                    : 'Mark Out for Delivery'}
                </button>
              )}

              {/* Delivered Button */}
              {canMarkDelivered && (
                <button
                  onClick={handleDeliverClick}
                  disabled={updatingStatus !== null}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  Mark as Delivered
                </button>
              )}

              {/* Status already delivered */}
              {order.status === 'delivered' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <svg
                    className="w-12 h-12 text-green-600 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-semibold text-green-800">Order Delivered</p>
                  {order.deliveredAt && (
                    <p className="text-sm text-green-600 mt-1">
                      {new Date(order.deliveredAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {order.pickedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    {order.outForDeliveryAt || order.deliveredAt ? (
                      <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                    ) : null}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-gray-900">Picked</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.pickedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {order.outForDeliveryAt && (
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    {order.deliveredAt ? (
                      <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                    ) : null}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-gray-900">Out for Delivery</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.outForDeliveryAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {order.deliveredAt && (
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Delivered</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deliver Modal (Signature/Photo) */}
      <AnimatePresence>
        {showDeliverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!updatingStatus) {
                setShowDeliverModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Confirm Delivery
              </h2>

              {/* Photo Proof */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {deliveryPhotoPreview && (
                  <div className="mt-4">
                    <img
                      src={deliveryPhotoPreview}
                      alt="Delivery photo preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Signature Confirmation */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signatureConfirmed}
                    onChange={(e) => setSignatureConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      I confirm that the customer has received the order
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Please verify customer signature or confirmation
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeliverModal(false);
                    setDeliveryPhoto(null);
                    setDeliveryPhotoPreview(null);
                    setSignatureConfirmed(false);
                  }}
                  disabled={updatingStatus !== null}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeliverConfirm}
                  disabled={updatingStatus !== null || !signatureConfirmed}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showPaymentConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!updatingStatus) {
                setShowPaymentConfirmation(false);
                setSelectedPaymentType(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Confirmation
              </h2>
              <p className="text-gray-600 mb-6">
                How was the payment collected?
              </p>

              {/* Payment Type Buttons */}
              <div className="space-y-3 mb-6">
                <motion.button
                  onClick={() => handlePaymentTypeSelect('cod')}
                  disabled={updatingStatus !== null}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3 shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Collected Cash
                </motion.button>

                <motion.button
                  onClick={() => handlePaymentTypeSelect('qr')}
                  disabled={updatingStatus !== null}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3 shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scanned QR
                </motion.button>
              </div>

              {/* Loading State */}
              {updatingStatus === 'delivered' && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Marking as delivered...</p>
                </div>
              )}

              {/* Cancel Button */}
              {updatingStatus !== 'delivered' && (
                <button
                  onClick={() => {
                    setShowPaymentConfirmation(false);
                    setSelectedPaymentType(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

