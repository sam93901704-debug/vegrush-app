'use client';

import { useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminUploads() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiFetch('/api/admin/upload-product-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      setUploadedUrl(data.url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Image Uploads</h2>
        <p className="text-slate-600 mt-1">Upload product images</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-emerald-600">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          )}

          {uploadedUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Uploaded Image URL:</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 break-all">{uploadedUrl}</p>
              </div>
              {uploadedUrl && (
                <div className="mt-4">
                  <img src={uploadedUrl} alt="Uploaded" className="max-w-md rounded-lg border border-slate-200" />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

