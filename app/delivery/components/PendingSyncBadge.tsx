'use client';

import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingSyncBadgeProps {
  className?: string;
  showDetails?: boolean;
}

export default function PendingSyncBadge({ className = '', showDetails = false }: PendingSyncBadgeProps) {
  const { pendingCount, isRetrying, isOnline, retryAll, pendingRequests } = useOfflineQueue();

  if (pendingCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white rounded-full text-sm font-semibold shadow-lg"
      >
        <svg
          className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>
          {isRetrying ? 'Syncing...' : `${pendingCount} Pending Sync`}
        </span>
        {!isOnline && (
          <span className="text-xs opacity-75">(Offline)</span>
        )}
        {!isRetrying && isOnline && (
          <button
            onClick={retryAll}
            className="ml-2 px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-bold transition"
            title="Retry sync"
          >
            Retry
          </button>
        )}
      </motion.div>

      {/* Details Dropdown */}
      {showDetails && pendingRequests.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px] z-50"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Pending Sync Requests</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                >
                  <div className="font-medium text-gray-900">{request.method} {request.url}</div>
                  <div className="text-gray-600 mt-1">
                    {new Date(request.timestamp).toLocaleString()}
                  </div>
                  <div className="text-gray-500 mt-1">
                    Retries: {request.retryCount}/{3}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

