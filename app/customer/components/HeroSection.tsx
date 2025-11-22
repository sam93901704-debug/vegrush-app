'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl mb-8 px-6 py-16 md:py-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 
                     bg-clip-text text-transparent
                     animate-gradient bg-[length:200%_auto]"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #16a34a, #10b981, #14b8a6, #10b981, #16a34a)',
              animation: 'gradient 3s ease infinite',
            }}
          >
            Fresh Vegetables
          </span>
          <br />
          <span className="text-gray-800">Delivered Fast</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Shop the freshest produce delivered to your doorstep. Quality you can trust, speed you can rely on.
        </motion.p>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}

