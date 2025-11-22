'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import GoogleLoginButton from './components/GoogleLoginButton';

interface Slide {
  id: number;
  title: string;
  illustration: React.ReactNode;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Fresh Vegetables Delivered Fast',
    illustration: (
      <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Basket */}
        <path
          d="M80 280L120 200L280 200L320 280H80Z"
          fill="#D4E9D7"
          stroke="#4ADE80"
          strokeWidth="4"
        />
        <path
          d="M80 280L100 320H300L320 280"
          fill="#B8E6C1"
        />
        {/* Vegetables */}
        <circle cx="150" cy="220" r="25" fill="#16A34A" />
        <ellipse cx="250" cy="230" rx="30" ry="25" fill="#22C55E" />
        <circle cx="200" cy="200" r="20" fill="#15803D" />
        <ellipse cx="180" cy="250" rx="20" ry="30" fill="#22C55E" />
        <circle cx="270" cy="210" r="18" fill="#16A34A" />
        {/* Delivery truck */}
        <rect x="260" y="140" width="100" height="60" rx="5" fill="#3B82F6" />
        <rect x="280" y="120" width="60" height="30" rx="3" fill="#60A5FA" />
        <circle cx="280" cy="200" r="15" fill="#1E293B" />
        <circle cx="340" cy="200" r="15" fill="#1E293B" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Transparent Pricing, Best Quality',
    illustration: (
      <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Price tag */}
        <path
          d="M180 80L320 220L220 320L80 180L180 80Z"
          fill="#FEF3C7"
          stroke="#F59E0B"
          strokeWidth="4"
        />
        <circle cx="200" cy="120" r="25" fill="#F59E0B" />
        {/* Vegetables on scale */}
        <rect x="120" y="240" width="160" height="10" fill="#6B7280" />
        <path
          d="M120 250L110 300L130 300L120 250Z"
          fill="#9CA3AF"
        />
        <path
          d="M280 250L290 300L270 300L280 250Z"
          fill="#9CA3AF"
        />
        {/* Vegetables */}
        <circle cx="160" cy="200" r="30" fill="#16A34A" />
        <circle cx="240" cy="190" r="25" fill="#22C55E" />
        <ellipse cx="200" cy="220" rx="25" ry="30" fill="#15803D" />
        {/* Quality check mark */}
        <circle cx="180" cy="130" r="15" fill="#FFFFFF" />
        <path
          d="M175 130L178 133L185 126"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Quick Delivery to Your Doorstep',
    illustration: (
      <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* House */}
        <path
          d="M200 60L120 140H280L200 60Z"
          fill="#FCD34D"
          stroke="#F59E0B"
          strokeWidth="4"
        />
        <rect x="140" y="140" width="120" height="100" fill="#FBBF24" />
        <rect x="180" y="180" width="40" height="60" fill="#FCD34D" />
        {/* Delivery person with bag */}
        <circle cx="280" cy="280" r="25" fill="#FED7AA" />
        <rect x="260" y="305" width="40" height="60" fill="#3B82F6" />
        <path
          d="M270 305L275 280L285 280L290 305L270 305Z"
          fill="#FED7AA"
        />
        {/* Delivery bag */}
        <path
          d="M300 290L320 340L340 340L360 290L300 290Z"
          fill="#60A5FA"
          stroke="#3B82F6"
          strokeWidth="3"
        />
        <path
          d="M310 290L330 290L330 340L310 340L310 290Z"
          fill="#93C5FD"
        />
        {/* Path/road */}
        <rect x="80" y="360" width="240" height="20" fill="#6B7280" />
        <rect x="90" y="365" width="20" height="10" fill="#FFFFFF" />
        <rect x="130" y="365" width="20" height="10" fill="#FFFFFF" />
        <rect x="170" y="365" width="20" height="10" fill="#FFFFFF" />
        <rect x="210" y="365" width="20" height="10" fill="#FFFFFF" />
        <rect x="250" y="365" width="20" height="10" fill="#FFFFFF" />
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    if (hasCompletedOnboarding === 'true') {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        router.push('/customer');
      } else {
        setShowLogin(true);
      }
    }
  }, [router]);

  // Handle swipe gestures
  const handleDragStart = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragStartX(info.point.x);
    setIsDragging(true);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const dragDistance = info.point.x - dragStartX;
    const swipeThreshold = 50;

    if (Math.abs(dragDistance) > swipeThreshold) {
      if (dragDistance < 0 && currentSlide < slides.length - 1) {
        // Swipe left - next slide
        setCurrentSlide((prev) => prev + 1);
      } else if (dragDistance > 0 && currentSlide > 0) {
        // Swipe right - previous slide
        setCurrentSlide((prev) => prev - 1);
      }
    }
  };

  // Handle next button
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      // Show login screen after last slide
      setShowLogin(true);
    }
  };

  // Handle skip button
  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowLogin(true);
  };

  // Handle Google login success
  const handleLoginSuccess = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    router.push('/customer');
  };

  // Show login screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600">Sign in to continue shopping fresh vegetables</p>
          </div>

          <GoogleLoginButton onSuccess={handleLoginSuccess} />

          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden relative">
      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        className="absolute top-8 right-6 z-10 px-4 py-2 text-gray-600 hover:text-gray-900 transition font-medium text-sm"
      >
        Skip
      </motion.button>

      {/* Slides container */}
      <div className="relative h-screen w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {slides.map((slide, index) => {
            if (index !== currentSlide) return null;

            return (
              <motion.div
                key={slide.id}
                ref={slideRef}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="w-full max-w-md px-6 flex flex-col items-center justify-center"
              >
                {/* Illustration */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
                  className="w-full h-80 mb-8 flex items-center justify-center"
                >
                  <div className="w-full h-full max-w-sm">
                    {slide.illustration}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 leading-tight"
                >
                  {slide.title}
                </motion.h1>

                {/* Dots indicator */}
                <div className="flex gap-2 mb-8">
                  {slides.map((_, dotIndex) => (
                    <motion.div
                      key={dotIndex}
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: dotIndex === currentSlide ? 1.2 : 1,
                        width: dotIndex === currentSlide ? 24 : 8,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`h-2 rounded-full ${
                        dotIndex === currentSlide
                          ? 'bg-green-600 w-6'
                          : 'bg-gray-300 w-2'
                      }`}
                    />
                  ))}
                </div>

                {/* Next button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="w-full max-w-xs px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Swipe hint */}
      {!isDragging && currentSlide < slides.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-400 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Swipe to continue
        </motion.div>
      )}
    </div>
  );
}

