export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vegrush-backend.onrender.com';

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_URL not set, using default:', API_URL);
}

