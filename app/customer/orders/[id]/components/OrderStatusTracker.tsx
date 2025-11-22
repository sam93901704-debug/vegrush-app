'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OrderStatusTrackerProps {
  status: string;
  createdAt?: string;
  pickedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  assignedDelivery?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber?: string | null;
  } | null;
  address?: {
    latitude?: string | number | null;
    longitude?: string | number | null;
    fullAddress: string;
  } | null;
  onStatusChanged?: (newStatus: string) => void;
}

interface StatusStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  getTimestamp: (order: OrderStatusTrackerProps) => string | null;
  message: string;
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: 'pending',
    label: 'Placed',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    getTimestamp: (order) => order.createdAt || null,
    message: 'Your order has been placed successfully',
  },
  {
    key: 'confirmed',
    label: 'Accepted',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    getTimestamp: (order) => {
      // For confirmed status, use createdAt if order is confirmed or later
      if (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered') {
        return order.createdAt || null;
      }
      return null;
    },
    message: 'Restaurant has accepted your order',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    getTimestamp: (order) => order.outForDeliveryAt || order.pickedAt || null,
    message: 'Your order is on the way to you',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    getTimestamp: (order) => order.deliveredAt || null,
    message: 'Your order has been delivered',
  },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 1, // Treat preparing same as confirmed
  out_for_delivery: 2,
  picked: 2, // Treat picked same as out_for_delivery
  delivered: 3,
  cancelled: -1,
};

export default function OrderStatusTracker({
  status,
  createdAt,
  pickedAt,
  outForDeliveryAt,
  deliveredAt,
  assignedDelivery,
  address,
  onStatusChanged,
}: OrderStatusTrackerProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  const currentStepIndex = STATUS_ORDER[status] ?? 0;
  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered';

  // Detect status change and trigger celebration
  useEffect(() => {
    if (previousStatus && previousStatus !== status && status === 'delivered') {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    if (previousStatus !== status) {
      setPreviousStatus(status);
      if (onStatusChanged) {
        onStatusChanged(status);
      }
    }
  }, [status, previousStatus, onStatusChanged]);

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleTrackOnMap = () => {
    if (!address) return;
    
    const lat = address.latitude;
    const lng = address.longitude;
    
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      // Fallback: use fullAddress for Google Maps search
      const encodedAddress = encodeURIComponent(address.fullAddress);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
      return;
    }
    
    const latStr = typeof lat === 'string' ? lat : lat.toString();
    const lngStr = typeof lng === 'string' ? lng : lng.toString();
    
    // Open Google Maps with coordinates
    const googleMapsUrl = `https://www.google.com/maps?q=${latStr},${lngStr}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleCallDeliveryBoy = () => {
    if (!assignedDelivery || !assignedDelivery.phone) return;
    window.location.href = `tel:${assignedDelivery.phone}`;
  };

  // Calculate progress percentage
  const progressPercentage = currentStepIndex >= 0 
    ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100 
    : 0;

  // Create order props object for step timestamp functions
  const orderProps: OrderStatusTrackerProps = {
    status,
    createdAt,
    pickedAt,
    outForDeliveryAt,
    deliveredAt,
    assignedDelivery,
    address,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative overflow-hidden">
      {/* Celebration Animation Background */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 z-0"
          >
            {/* Confetti Effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-green-500 rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: `${50 + (Math.random() * 100 - 50)}%`,
                  y: `${50 + (Math.random() * 100 - 50)}%`,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
          {isDelivered && showCelebration && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-4xl"
            >
              🎉
            </motion.div>
          )}
        </div>

        {isCancelled ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-lg font-semibold text-red-600">Order Cancelled</p>
          </div>
        ) : (
          <div className="relative">
            {/* Animated Progress Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
            </div>

            {/* Status Steps */}
            <div className="relative flex justify-between pb-8">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPending = index > currentStepIndex;
                const stepStatus = isCurrent ? 'current' : isCompleted ? 'completed' : 'pending';
                const timestamp = step.getTimestamp(orderProps);
                const isExpanded = expandedStep === index;

                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {/* Step Circle - Clickable */}
                    <motion.button
                      onClick={() => setExpandedStep(isExpanded ? null : index)}
                      disabled={isPending && !timestamp}
                      whileHover={isExpanded || isCompleted || isCurrent ? { scale: 1.1 } : {}}
                      whileTap={isExpanded || isCompleted || isCurrent ? { scale: 0.95 } : {}}
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 mb-3 z-10 ${
                        stepStatus === 'completed'
                          ? 'bg-green-500 text-white shadow-lg cursor-pointer hover:shadow-xl'
                          : stepStatus === 'current'
                          ? 'bg-green-500 text-white shadow-lg cursor-pointer hover:shadow-xl scale-110'
                          : timestamp
                          ? 'bg-gray-300 text-gray-600 cursor-pointer hover:bg-gray-400'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {/* Icon */}
                      <span
                        className={`relative z-10 transition-all duration-300 ${
                          stepStatus === 'current' ? 'scale-110' : ''
                        }`}
                      >
                        {step.icon}
                      </span>

                      {/* Pulse animation for current step */}
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-green-500"
                          animate={{
                            scale: [1, 1.5, 1.5],
                            opacity: [0.5, 0, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      )}

                      {/* Checkmark overlay for completed steps */}
                      {isCompleted && !isCurrent && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>

                    {/* Step Label */}
                    <div className="text-center w-full">
                      <p
                        className={`text-sm font-semibold transition-all duration-300 ${
                          stepStatus === 'completed' || stepStatus === 'current'
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && !isDelivered && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-xs text-gray-500 mt-1"
                        >
                          In Progress
                        </motion.p>
                      )}
                    </div>

                    {/* Expanded Step Details */}
                    <AnimatePresence>
                      {isExpanded && timestamp && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-24 left-1/2 transform -translate-x-1/2 w-64 bg-white rounded-lg shadow-xl border-2 border-green-200 p-4 z-20"
                        >
                          <div className="text-center space-y-2">
                            <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                            <p className="text-xs text-gray-600">{step.message}</p>
                            <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-gray-500 font-medium">
                                {formatTimestamp(timestamp)}
                              </p>
                            </div>
                          </div>
                          {/* Arrow pointer */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-green-200 rotate-45"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            {(assignedDelivery || address) && !isCancelled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200"
              >
                {/* Call Delivery Boy Button */}
                {assignedDelivery && assignedDelivery.phone && (
                  <motion.button
                    onClick={handleCallDeliveryBoy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {assignedDelivery.name || 'Delivery Boy'}
                  </motion.button>
                )}

                {/* Track on Map Button */}
                {address && address.fullAddress && (
                  <motion.button
                    onClick={handleTrackOnMap}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Track on Map
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Celebration Message */}
            <AnimatePresence>
              {isDelivered && showCelebration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300 text-center"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-bold text-green-800 flex items-center justify-center gap-2"
                  >
                    <span className="text-2xl">🎉</span>
                    Order Delivered Successfully!
                    <span className="text-2xl">🎉</span>
                  </motion.p>
                  {deliveredAt && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-green-700 mt-2"
                    >
                      Delivered on {formatTimestamp(deliveredAt)}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
