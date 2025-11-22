import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vegrush.customer',
  appName: 'VegRush',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Allow navigation to backend API
    allowNavigation: [
      // Backend API (adjust to your production URL)
      'http://localhost:4000',
      'https://your-backend-api.railway.app',
      'https://your-backend-api.vercel.app',
      '*.railway.app',
      '*.vercel.app',
      // Supabase URLs
      '*.supabase.co',
      'https://*.supabase.co',
      // Firebase/Google CDN
      '*.googleapis.com',
      '*.google.com',
      '*.gstatic.com',
      '*.firebaseio.com',
      '*.firebaseapp.com',
      // Common CDNs
      '*.cloudfront.net',
      '*.amazonaws.com',
    ],
    // For development, you can use localhost
    // For production, comment out or remove this
    cleartext: true, // Allows HTTP on Android (required for localhost development)
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set this in local config or CI/CD
      keystoreAlias: undefined, // Set this in local config or CI/CD
      keystorePassword: undefined, // Set this in local config or CI/CD
      keystoreAliasPassword: undefined, // Set this in local config or CI/CD
    },
  },
};

export default config;

