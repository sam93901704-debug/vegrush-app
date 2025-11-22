'use client';

/**
 * FCM Service for customer app
 * Handles Firebase Cloud Messaging registration and token management
 */

// Firebase configuration (should be moved to env variables)
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let messaging: any = null;
let isInitialized = false;

/**
 * Initialize Firebase and get messaging instance
 */
async function initializeFirebase(): Promise<any> {
  if (typeof window === 'undefined') {
    return null; // SSR safety
  }

  if (isInitialized && messaging) {
    return messaging;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, isSupported } = await import('firebase/messaging');

    // Check if Firebase is supported in this environment
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.warn('Firebase Cloud Messaging is not supported in this environment');
      return null;
    }

    // Initialize Firebase app if not already initialized
    let app;
    const apps = getApps();
    if (apps.length === 0) {
      app = initializeApp(FIREBASE_CONFIG);
    } else {
      app = apps[0];
    }

    // Get messaging instance
    messaging = getMessaging(app);
    isInitialized = true;

    return messaging;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Request notification permission from the user
 * Returns true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }

  // Check current permission
  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was previously denied');
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Get FCM token for the current device
 * Requires notification permission to be granted first
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const messagingInstance = await initializeFirebase();
    if (!messagingInstance) {
      console.warn('Firebase messaging not available');
      return null;
    }

    // Import getToken dynamically
    const { getToken } = await import('firebase/messaging');

    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
    });

    if (!token) {
      console.warn('No FCM token available');
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Save FCM token to backend
 */
export async function saveFcmTokenToBackend(token: string): Promise<boolean> {
  try {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      console.warn('No auth token found. User must be logged in to save FCM token.');
      return false;
    }

    const response = await fetch('http://localhost:4000/api/user/fcm-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to save FCM token:', errorData.message || response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving FCM token to backend:', error);
    return false;
  }
}

/**
 * Register for push notifications
 * Complete flow: request permission -> get token -> save to backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Step 1: Request notification permission
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.warn('Notification permission not granted');
      return null;
    }

    // Step 2: Get FCM token
    const token = await getFcmToken();
    if (!token) {
      console.warn('Failed to get FCM token');
      return null;
    }

    // Step 3: Save token to backend
    const saved = await saveFcmTokenToBackend(token);
    if (!saved) {
      console.warn('Failed to save FCM token to backend');
      return token; // Return token even if backend save fails
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Handle token refresh
 * FCM tokens can expire or change, so we need to update them
 */
export async function setupTokenRefresh(): Promise<void> {
  try {
    const messagingInstance = await initializeFirebase();
    if (!messagingInstance) {
      return;
    }

    // Import onMessage dynamically
    const { onMessage } = await import('firebase/messaging');

    // Listen for foreground messages
    onMessage(messagingInstance, (payload) => {
      console.log('Message received in foreground:', payload);
      // You can show a notification here if needed
      if (payload.notification) {
        new Notification(payload.notification.title || 'New notification', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon.png',
        });
      }
    });

    // Listen for token refresh
    // Note: getToken returns a new token when refreshed, but we need to listen for changes
    // Firebase handles this automatically, but we should save new tokens
    setInterval(async () => {
      const token = await getFcmToken();
      if (token) {
        await saveFcmTokenToBackend(token);
      }
    }, 24 * 60 * 60 * 1000); // Check once per day
  } catch (error) {
    console.error('Error setting up token refresh:', error);
  }
}

