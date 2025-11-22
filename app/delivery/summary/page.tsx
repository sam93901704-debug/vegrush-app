'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  };
}

interface Address {
  id: string;
  fullAddress: string;
  city: string | null;
  pincode: string | null;
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
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  deliveredAt: string | Date;
  address: Address;
  user: User;
  items: OrderItem[];
}

interface SummaryData {
  deliveredOrdersCount: number;
  totalCOD: number;
  totalQR: number;
  distanceTravelled: number | null;
  orders: Order[];
}

export default function DeliverySummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch('http://localhost:4000/api/delivery/summary', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error('Failed to fetch summary');
        }

        const data: SummaryData = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Format price (paise to rupees)
  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!summary || summary.orders.length === 0) {
      alert('No orders to export');
      return;
    }

    setExporting(true);

    try {
      // Create CSV headers
      const headers = [
        'Order Number',
        'Customer Name',
        'Customer Phone',
        'Address',
        'City',
        'Pincode',
        'Total Amount (₹)',
        'Delivery Fee (₹)',
        'Payment Method',
        'Delivered At',
        'Items',
      ];

      // Create CSV rows
      const rows = summary.orders.map((order) => {
        const items = order.items
          .map((item) => `${item.product.name} (${parseFloat(item.qty).toFixed(2)} ${item.product.category})`)
          .join('; ');
        
        const totalAmountRupees = (order.totalAmount / 100).toFixed(2);
        const deliveryFeeRupees = (order.deliveryFee / 100).toFixed(2);

        return [
          order.orderNumber,
          order.user.name,
          order.user.phone || 'N/A',
          order.address.fullAddress,
          order.address.city || 'N/A',
          order.address.pincode || 'N/A',
          totalAmountRupees,
          deliveryFeeRupees,
          order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : order.paymentMethod === 'qr_on_delivery' || order.paymentMethod === 'qr'
            ? 'QR Code'
            : order.paymentMethod,
          formatDate(order.deliveredAt),
          items,
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `delivery_summary_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExporting(false);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError('Failed to export CSV');
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Today's Summary</h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition rounded-full hover:bg-gray-100"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Delivered Orders Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Delivered Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.deliveredOrdersCount}</p>
            <p className="text-xs text-gray-500 mt-2">Orders delivered today</p>
          </motion.div>

          {/* Total COD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Cash Collected</h3>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(summary.totalCOD)}</p>
            <p className="text-xs text-gray-500 mt-2">Total COD payments</p>
          </motion.div>

          {/* Total QR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">QR Payments</h3>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(summary.totalQR)}</p>
            <p className="text-xs text-gray-500 mt-2">Total QR payments</p>
          </motion.div>

          {/* Distance Travelled */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Distance</h3>
            <p className="text-3xl font-bold text-gray-900">
              {summary.distanceTravelled !== null ? `${summary.distanceTravelled.toFixed(1)} km` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Distance travelled today</p>
          </motion.div>
        </div>

        {/* Total Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-green-100 mb-1">Total Collection</h3>
              <p className="text-4xl font-bold">{formatPrice(summary.totalCOD + summary.totalQR)}</p>
              <p className="text-sm text-green-100 mt-2">Total amount collected today</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Deliveries</h2>
            {summary.orders.length > 0 && (
              <motion.button
                onClick={handleExportCSV}
                disabled={exporting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </>
                )}
              </motion.button>
            )}
          </div>

          {summary.orders.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No deliveries today</p>
              <p className="text-gray-400 text-sm mt-2">Orders delivered today will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {summary.orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(order.deliveredAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'cod'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'cod'
                          ? 'COD'
                          : order.paymentMethod === 'qr_on_delivery' || order.paymentMethod === 'qr'
                          ? 'QR'
                          : order.paymentMethod}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{order.user.name}</span>
                      {order.user.phone && (
                        <>
                          <span>•</span>
                          <span>{order.user.phone}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="flex-1">{order.address.fullAddress}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

