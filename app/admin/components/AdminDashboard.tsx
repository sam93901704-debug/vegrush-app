'use client';

import { useQuery } from '@tanstack/react-query';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { apiFetch } from '@/utils/apiFetch';
import { motion } from 'framer-motion';

interface Stats {
  totalProducts: number;
  ordersToday: number;
  activeCustomers: number;
}

function StatCard({ title, value, icon, delay = 0 }: { title: string; value: string | number; icon: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: productsData } = useAdminProducts({ limit: 1 });
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-today'],
    queryFn: async () => {
      return await apiFetch('/api/admin/orders?limit=100');
    },
  });

  const totalProducts = productsData?.pagination?.total || 0;
  
  // Calculate orders today
  const today = new Date().toISOString().split('T')[0];
  const ordersToday = ordersData?.data?.filter((order: any) => 
    order.createdAt?.startsWith(today)
  ).length || 0;

  // Mock active customers (would need separate endpoint)
  const activeCustomers = 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Overview</h2>
        <p className="text-slate-600">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon="📦"
          delay={0}
        />
        <StatCard
          title="Orders Today"
          value={ordersLoading ? '...' : ordersToday}
          icon="📋"
          delay={0.1}
        />
        <StatCard
          title="Active Customers"
          value={activeCustomers}
          icon="👥"
          delay={0.2}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-colors border border-emerald-200">
            <div className="font-semibold text-emerald-900">Add New Product</div>
            <div className="text-sm text-emerald-700 mt-1">Create a new product listing</div>
          </button>
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors border border-blue-200">
            <div className="font-semibold text-blue-900">View Orders</div>
            <div className="text-sm text-blue-700 mt-1">Manage customer orders</div>
          </button>
        </div>
      </div>
    </div>
  );
}

