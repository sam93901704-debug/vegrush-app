'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminProducts, useUpdateStock, useDeleteProduct } from '../../hooks/useAdminProducts';
import { ProductListSkeleton } from '../../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Product } from '../../hooks/useProducts';

interface AdminProductsListProps {
  searchQuery: string;
}

export default function AdminProductsList({ searchQuery }: AdminProductsListProps) {
  const router = useRouter();
  const { data, isLoading, error } = useAdminProducts({
    search: searchQuery || undefined,
    limit: 100,
  });
  const updateStock = useUpdateStock();
  const deleteProduct = useDeleteProduct();

  const handleStockUpdate = async (id: string, newStock: number) => {
    try {
      await updateStock.mutateAsync({ id, stockQty: newStock });
      toast.success('Stock updated successfully');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct.mutateAsync({ id });
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (isLoading) {
    return <ProductListSkeleton count={6} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Failed to load products
      </div>
    );
  }

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products</h2>
          <p className="text-slate-600 mt-1">{products.length} total products</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-600">No products found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Mobile: Card View */}
          <div className="block sm:hidden divide-y divide-slate-200">
            <AnimatePresence>
              {products.map((product: Product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-xs">No img</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{product.name}</div>
                      <div className="text-sm text-slate-500">{product.category}</div>
                      <div className="text-sm font-medium text-slate-900 mt-1">
                        ₹{(product.price / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-sm">
                      <span className="text-slate-600">Stock: </span>
                      <span className="font-medium">{parseFloat(product.stockQty).toFixed(2)}</span>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                        product.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <input
                      type="number"
                      defaultValue={parseFloat(product.stockQty)}
                      onBlur={(e) => {
                        const newStock = parseFloat(e.target.value);
                        if (!isNaN(newStock) && newStock >= 0) {
                          handleStockUpdate(product.id, newStock);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                      className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop: Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <AnimatePresence>
                  {products.map((product: Product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                              <span className="text-slate-400 text-xs">No img</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-slate-500 line-clamp-1">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        ₹{(product.price / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          defaultValue={parseFloat(product.stockQty)}
                          onBlur={(e) => {
                            const newStock = parseFloat(e.target.value);
                            if (!isNaN(newStock) && newStock >= 0) {
                              handleStockUpdate(product.id, newStock);
                            }
                          }}
                          className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                            product.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

