'use client';

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/config/api';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { motion } from 'framer-motion';

export default function AdminOrdersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/orders?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Failed to load orders
      </div>
    );
  }

  const orders = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
        <p className="text-slate-600 mt-1">{orders.length} total orders</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order: any) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.user?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    ₹{((order.totalAmount + order.deliveryFee) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

