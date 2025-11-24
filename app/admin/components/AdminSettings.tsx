'use client';

import { motion } from 'framer-motion';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-1">Manage your store settings</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <p className="text-slate-600">Settings panel coming soon...</p>
      </motion.div>
    </div>
  );
}

