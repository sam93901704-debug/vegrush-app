'use client';

import { useEffect, useState } from 'react';
import { useFcmRegistration } from '../hooks/useFcmRegistration';

/**
 * FCM Registration Component
 * Automatically registers for push notifications when user is logged in
 * 
 * This component:
 * 1. Checks if user is logged in (has token in localStorage)
 * 2. Requests notification permission
 * 3. Gets FCM token
 * 4. Saves token to backend
 */
export default function FcmRegistration() {
  const { register, isRegistering, isRegistered, error } = useFcmRegistration();
  const [hasAttemptedRegistration, setHasAttemptedRegistration] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAndRegister = async () => {
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        // User not logged in, skip registration
        return;
      }

      // Check if we already attempted registration in this session
      if (hasAttemptedRegistration) {
        return;
      }

      // Check if permission was previously denied
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'denied') {
          console.debug('Notification permission was previously denied');
          return;
        }
      }

      // User is logged in and permission not denied - attempt registration
      setHasAttemptedRegistration(true);
      
      try {
        await register();
      } catch (err) {
        // Silent fail - Firebase might not be configured
      }
    };

    // Register after a short delay to ensure auth is complete
    const timer = setTimeout(() => {
      checkAndRegister();
    }, 1000);

    return () => clearTimeout(timer);
  }, [register, hasAttemptedRegistration]);

  // Listen for login events (token storage in localStorage)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      // If token is added to localStorage, user just logged in
      if (e.key === 'token' && e.newValue && !hasAttemptedRegistration) {
        setHasAttemptedRegistration(true);
        
        // Wait a bit for the auth state to settle
        setTimeout(async () => {
          try {
            await register();
          } catch (err) {
            console.error('FCM registration failed after login:', err);
          }
        }, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically if user logs in via same window
    const checkInterval = setInterval(() => {
      const authToken = localStorage.getItem('token');
      if (authToken && !hasAttemptedRegistration) {
        setHasAttemptedRegistration(true);
        setTimeout(async () => {
          try {
            await register();
          } catch (err) {
            console.error('FCM registration failed:', err);
          }
        }, 500);
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [register, hasAttemptedRegistration]);

  // This component doesn't render anything
  // It works silently in the background
  return null;
}

