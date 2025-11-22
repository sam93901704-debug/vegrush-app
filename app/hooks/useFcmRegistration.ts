'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  registerForPushNotifications,
  setupTokenRefresh,
  getFcmToken,
  saveFcmTokenToBackend,
} from '../services/fcmService';

/**
 * Custom hook to handle FCM registration
 * 
 * Usage:
 * const { register, isRegistering, isRegistered, error } = useFcmRegistration();
 * 
 * // On login
 * await register();
 */
export function useFcmRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check if already registered on mount
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const existingToken = await getFcmToken();
        if (existingToken) {
          setToken(existingToken);
          // Try to save to backend if we have auth token
          const authToken = localStorage.getItem('token');
          if (authToken) {
            await saveFcmTokenToBackend(existingToken);
            setIsRegistered(true);
          }
        }
      } catch (err) {
        // Silently fail - token might not be available yet
        console.debug('No existing FCM token found');
      }
    };

    checkExistingToken();
  }, []);

  // Setup token refresh listener
  useEffect(() => {
    const setupRefresh = async () => {
      try {
        await setupTokenRefresh();
      } catch (err) {
        console.error('Failed to setup token refresh:', err);
      }
    };

    setupRefresh();
  }, []);

  // Register for push notifications
  const register = useCallback(async (): Promise<string | null> => {
    setIsRegistering(true);
    setError(null);

    try {
      // Check if user is logged in
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error('User must be logged in to register for push notifications');
      }

      // Register for push notifications
      const fcmToken = await registerForPushNotifications();

      if (fcmToken) {
        setToken(fcmToken);
        setIsRegistered(true);
        return fcmToken;
      } else {
        throw new Error('Failed to register for push notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for push notifications';
      setError(errorMessage);
      console.error('FCM registration error:', err);
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return {
    register,
    isRegistering,
    isRegistered,
    error,
    token,
  };
}

