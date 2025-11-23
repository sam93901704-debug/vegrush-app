'use client';

import { motion } from 'framer-motion';

interface GoogleLoginButtonProps {
  onSuccess: () => void;
}

export default function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const handleClick = () => {
    // Directly call onSuccess - no auth needed in dev mode
    onSuccess();
  };

  return (
    <div className="w-full">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-3 shadow-sm"
      >
        Continue
      </motion.button>
    </div>
  );
}
