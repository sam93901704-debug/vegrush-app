'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '../../../config/api';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unitType: string;
  unitValue: string;
  stockQty: string;
  imageUrl: string | null;
  isActive: boolean;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  price: string; // In rupees, will convert to paise
  unitType: 'kg' | 'g' | 'piece';
  unitValue: string;
  stockQty: string;
  imageUrl: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  unitType?: string;
  unitValue?: string;
  stockQty?: string;
  image?: string;
  _submit?: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    price: '',
    unitType: 'kg',
    unitValue: '',
    stockQty: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Available categories
  const categories = [
    'Grains & Pulses',
    'Dairy & Eggs',
    'Fruits & Vegetables',
    'Spices & Condiments',
    'Beverages',
    'Snacks & Sweets',
    'Other',
  ];

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setErrors({ _submit: 'Authentication required' });
          return;
        }

        const response = await fetch(
          `${API_URL}/api/admin/products/${productId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const product: Product = await response.json();

        // Pre-fill form with product data
        setFormData({
          name: product.name,
          description: product.description || '',
          category: product.category,
          price: (product.price / 100).toFixed(2), // Convert paise to rupees
          unitType: product.unitType as 'kg' | 'g' | 'piece',
          unitValue: product.unitValue,
          stockQty: product.stockQty,
          imageUrl: product.imageUrl || '',
        });

        // Set original image for preview
        if (product.imageUrl) {
          setOriginalImageUrl(product.imageUrl);
          setImagePreview(product.imageUrl);
        }
      } catch (error) {
        setErrors({
          _submit: error instanceof Error ? error.message : 'Failed to load product',
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, image: 'Only JPG, PNG, and WEBP images are allowed' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'Image size must be less than 5MB' });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, image: undefined });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image
  const uploadImage = async (): Promise<string> => {
    if (!selectedFile) {
      throw new Error('No file selected');
    }

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${API_URL}/api/admin/upload-product-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Inline stock adjustment
  const adjustStock = (amount: number) => {
    const currentStock = parseFloat(formData.stockQty) || 0;
    const newStock = Math.max(0, currentStock + amount);
    setFormData({ ...formData, stockQty: newStock.toFixed(2) });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Price must be a valid positive number';
      }
    }

    if (!formData.unitValue) {
      newErrors.unitValue = 'Unit value is required';
    } else {
      const unitValueNum = parseFloat(formData.unitValue);
      if (isNaN(unitValueNum) || unitValueNum <= 0) {
        newErrors.unitValue = 'Unit value must be a positive number';
      }
    }

    if (!formData.stockQty) {
      newErrors.stockQty = 'Stock quantity is required';
    } else {
      const stockQtyNum = parseFloat(formData.stockQty);
      if (isNaN(stockQtyNum) || stockQtyNum < 0) {
        newErrors.stockQty = 'Stock quantity must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Step 1: Upload image if new file selected
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      // Step 2: Convert price from rupees to paise
      const priceInPaise = Math.round(parseFloat(formData.price) * 100);

      // Step 3: Update product
      const response = await fetch(
        `${API_URL}/api/admin/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category,
            price: priceInPaise,
            unitType: formData.unitType,
            unitValue: parseFloat(formData.unitValue),
            stockQty: parseFloat(formData.stockQty),
            imageUrl: imageUrl || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update product');
      }

      // Show success toast
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/admin/products');
      }, 2000);
    } catch (error) {
      setErrors({
        ...errors,
        _submit: error instanceof Error ? error.message : 'Failed to update product',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Products
        </button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Product updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter product name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter product description (optional)"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.category
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category}</p>
          )}
        </div>

        {/* Price */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.price
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price}</p>
          )}
        </div>

        {/* Unit Type and Unit Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unitType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unitType: e.target.value as 'kg' | 'g' | 'piece',
                })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.unitType
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="piece">piece</option>
            </select>
            {errors.unitType && (
              <p className="mt-1 text-sm text-red-500">{errors.unitType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.unitValue}
              onChange={(e) => setFormData({ ...formData, unitValue: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.unitValue
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="1.0"
            />
            {errors.unitValue && (
              <p className="mt-1 text-sm text-red-500">{errors.unitValue}</p>
            )}
          </div>
        </div>

        {/* Stock Quantity with Inline Adjust */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.stockQty}
              onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
              className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.stockQty
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="0.00"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustStock(-5)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => adjustStock(-10)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => adjustStock(10)}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => adjustStock(5)}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold"
              >
                +5
              </button>
            </div>
          </div>
          {errors.stockQty && (
            <p className="mt-1 text-sm text-red-500">{errors.stockQty}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Current stock: {parseFloat(formData.stockQty || '0').toFixed(2)} {formData.unitType}
          </p>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <div className="flex gap-6">
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploadingImage}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-500">{errors.image}</p>
              )}
              {uploadingImage && (
                <p className="mt-1 text-sm text-blue-500">Uploading image...</p>
              )}
              {originalImageUrl && !selectedFile && (
                <p className="mt-1 text-xs text-gray-500">
                  Current image will be kept if no new file is selected
                </p>
              )}
            </div>
            {imagePreview && (
              <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Error */}
        {errors._submit && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors._submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

