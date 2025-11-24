'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminProducts, useUpdateStock, useDeleteProduct } from '../../hooks/useAdminProducts';
import { useUpdateProduct } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchBar } from '../../components/ui/SearchBar';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Product } from '../../hooks/useProducts';

export default function AdminProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, error } = useAdminProducts({
    search: debouncedSearch || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    limit: 100,
  });

  const updateStock = useUpdateStock();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = data?.data || [];

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
    return uniqueCategories;
  }, [products]);

  const handleStockUpdate = async (productId: string, adjustment: number, currentStock: number) => {
    const newStock = Math.max(0, currentStock + adjustment);
    try {
      await updateStock.mutateAsync({ id: productId, stockQty: newStock });
      toast.success('Stock updated successfully');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await updateProduct.mutateAsync({
        id: productId,
        isActive: !currentStatus,
      });
      toast.success('Product status updated');
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct.mutateAsync({ id: productId });
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const formatPrice = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-sm text-slate-600 mt-1">{products.length} total products</p>
          </div>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl"
            >
              Failed to load products
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading && <TableSkeleton rows={5} />}

        {/* Products Table */}
        {!isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Mobile: Card View */}
            <div className="block sm:hidden divide-y divide-slate-200">
              <AnimatePresence>
                {products.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 text-center text-slate-500"
                  >
                    No products found
                  </motion.div>
                ) : (
                  products.map((product: Product) => (
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
                            className="h-20 w-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-20 w-20 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                            No Image
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                          <p className="text-sm text-slate-500">{product.category}</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="text-sm">
                          <span className="text-slate-600">Stock: </span>
                          <span className="font-medium">{parseFloat(product.stockQty).toFixed(2)} {product.unitType}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.isActive}
                            onChange={() => handleToggleActive(product.id, product.isActive)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleStockUpdate(product.id, -1, parseFloat(product.stockQty))}
                          disabled={updateStock.isPending}
                          className="flex-1 px-3 py-2 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleStockUpdate(product.id, 1, parseFloat(product.stockQty))}
                          disabled={updateStock.isPending}
                          className="flex-1 px-3 py-2 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}`)}
                          className="px-3 py-2 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteProduct.isPending}
                          className="px-3 py-2 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Desktop: Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <AnimatePresence>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      products.map((product: Product) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-16 w-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => router.push(`/admin/products/${product.id}`)}
                              className="text-left hover:text-emerald-600 transition-colors"
                            >
                              <div className="text-sm font-medium text-slate-900">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-slate-500 truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <span className="font-semibold">{formatPrice(product.price)}</span>
                            <span className="text-slate-500 text-xs ml-1">
                              / {product.unitValue} {product.unitType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-900 min-w-[80px]">
                                {parseFloat(product.stockQty).toFixed(2)} {product.unitType}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleStockUpdate(product.id, -10, parseFloat(product.stockQty))}
                                  disabled={updateStock.isPending}
                                  className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition disabled:opacity-50 font-medium"
                                  title="Decrease by 10"
                                >
                                  -10
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(product.id, -1, parseFloat(product.stockQty))}
                                  disabled={updateStock.isPending}
                                  className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition disabled:opacity-50 font-medium"
                                  title="Decrease by 1"
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(product.id, 1, parseFloat(product.stockQty))}
                                  disabled={updateStock.isPending}
                                  className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition disabled:opacity-50 font-medium"
                                  title="Increase by 1"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(product.id, 10, parseFloat(product.stockQty))}
                                  disabled={updateStock.isPending}
                                  className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition disabled:opacity-50 font-medium"
                                  title="Increase by 10"
                                >
                                  +10
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={product.isActive}
                                onChange={() => handleToggleActive(product.id, product.isActive)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/admin/products/${product.id}`)}
                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                disabled={deleteProduct.isPending}
                                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
