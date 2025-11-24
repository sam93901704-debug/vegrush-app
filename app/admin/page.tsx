'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { SearchBar } from '../components/ui/SearchBar';
import { ProductListSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { AuthGuard } from '../components/AuthGuard';
import toast from 'react-hot-toast';
import { API_URL } from '@/config/api';

// Import components (we'll create these)
import AdminDashboard from './components/AdminDashboard';
import AdminProductsList from './components/AdminProductsList';
import AdminProductForm from './components/AdminProductForm';
import AdminOrdersList from './components/AdminOrdersList';
import AdminUploads from './components/AdminUploads';
import AdminSettings from './components/AdminSettings';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Products', icon: '📦' },
    { name: 'Add Product', icon: '➕' },
    { name: 'Orders', icon: '📋' },
    { name: 'Uploads', icon: '📤' },
    { name: 'Settings', icon: '⚙️' },
  ];

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-0 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">V</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Manage your store</p>
              </div>
            </div>
            <div className="w-full sm:w-64">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm border border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex-shrink-0 rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-sm font-medium transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                    selected
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="text-xs sm:text-sm whitespace-nowrap">{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminDashboard />
              </motion.div>
            </Tab.Panel>

            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminProductsList searchQuery={searchQuery} />
              </motion.div>
            </Tab.Panel>

            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminProductForm onSuccess={() => setSelectedIndex(1)} />
              </motion.div>
            </Tab.Panel>

            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminOrdersList />
              </motion.div>
            </Tab.Panel>

            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminUploads />
              </motion.div>
            </Tab.Panel>

            <Tab.Panel>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AdminSettings />
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
    </AuthGuard>
  );
}
