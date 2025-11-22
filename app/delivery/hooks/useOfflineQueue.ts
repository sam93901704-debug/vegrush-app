'use client';

import { useState, useEffect } from 'react';
import { offlineQueue, type QueuedRequest } from '../utils/offlineQueue';

/**
 * React hook for offline queue
 * 
 * Provides:
 * - pendingCount: number of pending requests
 * - pendingRequests: array of pending requests
 * - isRetrying: whether queue is currently retrying
 * - retryAll: function to manually retry all requests
 * - retryRequest: function to retry a specific request
 * - isOnline: whether network is currently online
 */
export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<QueuedRequest[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Update queue state
  const updateQueueState = async () => {
    const count = await offlineQueue.getPendingCount();
    const requests = await offlineQueue.getPendingRequests();
    setPendingCount(count);
    setPendingRequests(requests);
  };

  // Setup network status listener
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load initial queue state
  useEffect(() => {
    updateQueueState();

    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe(() => {
      updateQueueState();
    });

    return unsubscribe;
  }, []);

  // Auto-retry when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isRetrying) {
      setIsRetrying(true);
      offlineQueue.retryAll().then(() => {
        setIsRetrying(false);
        updateQueueState();
      });
    }
  }, [isOnline, pendingCount, isRetrying]);

  // Manually retry all
  const retryAll = async () => {
    setIsRetrying(true);
    try {
      await offlineQueue.retryAll();
    } finally {
      setIsRetrying(false);
      await updateQueueState();
    }
  };

  // Retry specific request
  const retryRequest = async (id: string) => {
    setIsRetrying(true);
    try {
      await offlineQueue.retryRequestById(id);
    } finally {
      setIsRetrying(false);
      await updateQueueState();
    }
  };

  return {
    pendingCount,
    pendingRequests,
    isRetrying,
    isOnline,
    retryAll,
    retryRequest,
    refresh: updateQueueState,
  };
}

