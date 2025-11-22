'use client';

import { motion } from 'framer-motion';

interface FreshnessTagProps {
  isFresh?: boolean;
}

export default function FreshnessTag({ isFresh = true }: FreshnessTagProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="inline-flex items-center gap-2 px-4 py-2 
                 bg-gradient-to-r from-green-50 to-emerald-50 
                 border-2 border-green-200 rounded-full shadow-md"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="text-2xl"
      >
        🌿
      </motion.div>
      <span className="text-sm font-bold text-green-700">
        {isFresh ? 'Fresh Today' : 'Premium Quality'}
      </span>
    </motion.div>
  );
}

