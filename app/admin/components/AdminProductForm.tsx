'use client';

import { useState } from 'react';
import { useCreateProduct } from '../../hooks/useProducts';
import { API_URL } from '@/config/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface AdminProductFormProps {
  onSuccess?: () => void;
}

export default function AdminProductForm({ onSuccess }: AdminProductFormProps) {
  const createProduct = useCreateProduct();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    unitType: 'kg' as 'kg' | 'g' | 'piece',
    unitValue: '',
    stockQty: '',
    imageUrl: '',
  });

  const categories = [
    'Grains & Pulses',
    'Dairy & Eggs',
    'Fruits & Vegetables',
    'Spices & Condiments',
    'Beverages',
    'Snacks & Sweets',
    'Other',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string> => {
    if (!selectedFile) {
      throw new Error('No file selected');
    }

    setUploadingImage(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('image', selectedFile);

      const response = await fetch(`${API_URL}/api/admin/upload-product-image`, {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('No URL returned from upload');
      }
      return data.url;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price || !formData.unitValue || !formData.stockQty) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Upload image if selected
      let imageUrl = formData.imageUrl;
      if (selectedFile && !imageUrl) {
        imageUrl = await uploadImage();
      }

      // Convert price to paise
      const priceInPaise = Math.round(parseFloat(formData.price) * 100);

      await createProduct.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        price: priceInPaise,
        unitType: formData.unitType,
        unitValue: parseFloat(formData.unitValue),
        stockQty: parseFloat(formData.stockQty),
        imageUrl: imageUrl || undefined,
        isActive: true,
      });

      toast.success('Product created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        unitType: 'kg',
        unitValue: '',
        stockQty: '',
        imageUrl: '',
      });
      setSelectedFile(null);
      setImagePreview(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Add New Product</h2>
        <p className="text-slate-600 mt-1">Create a new product listing</p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter product name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter product description (optional)"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price and Unit Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unit Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unitType}
              onChange={(e) => setFormData({ ...formData, unitType: e.target.value as 'kg' | 'g' | 'piece' })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="piece">piece</option>
            </select>
          </div>
        </div>

        {/* Unit Value and Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unit Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.unitValue}
              onChange={(e) => setFormData({ ...formData, unitValue: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="1.0"
              required
            />
            <p className="text-xs text-slate-500 mt-1">e.g., 1 for 1kg, 0.5 for 500g</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.stockQty}
              onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
          <div className="flex gap-6">
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploadingImage}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {uploadingImage && (
                <p className="text-sm text-emerald-600 mt-2">Uploading image...</p>
              )}
            </div>
            {imagePreview && (
              <div className="w-32 h-32 border border-slate-300 rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={createProduct.isPending || uploadingImage}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createProduct.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

