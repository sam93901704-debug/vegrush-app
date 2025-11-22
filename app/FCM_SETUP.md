# FCM Registration Setup for Customer App

This document describes the FCM (Firebase Cloud Messaging) registration setup for the customer app.

## Overview

The customer app automatically registers for push notifications when users log in. This enables real-time notifications when delivery boys update order status.

## Components

### 1. Frontend Services (`app/services/fcmService.ts`)

- **`requestNotificationPermission()`**: Requests browser/mobile push permission
- **`getFcmToken()`**: Gets FCM token from Firebase SDK
- **`saveFcmTokenToBackend(token)`**: Saves token to backend via `POST /api/user/fcm-token`
- **`registerForPushNotifications()`**: Complete flow: permission -> token -> save

### 2. React Hook (`app/hooks/useFcmRegistration.ts`)

Custom hook that manages FCM registration state:
- `register()`: Manually trigger registration
- `isRegistering`: Loading state
- `isRegistered`: Success state
- `error`: Error message if any
- `token`: FCM token string

### 3. Auto-Registration Component (`app/components/FcmRegistration.tsx`)

Automatically registers for push notifications when:
- User logs in (detects token in localStorage)
- App loads and user is already logged in
- Works silently in the background (no UI)

### 4. Backend Route (`POST /api/user/fcm-token`)

- **Path**: `/api/user/fcm-token`
- **Method**: `POST`
- **Auth**: Requires `authenticateUser` middleware
- **Body**: `{ token: string }`
- **Response**: Updated user object

### 5. Database Schema

Added `fcmToken` column to `User` model:
```prisma
model User {
  // ... other fields
  fcmToken      String?   // FCM device token for push notifications
  // ... other fields
}
```

Migration file: `backend/prisma/migrations/20241220000000_add_user_fcm_token/migration.sql`

## Environment Variables

Add these to your `.env.local` file in the app directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## Installation

1. Install Firebase SDK:
```bash
npm install firebase
```

2. Run Prisma migration:
```bash
cd backend
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

3. The `FcmRegistration` component is already integrated in `app/layout.tsx`

## Flow

1. **On Login**:
   - User logs in via Google OAuth
   - Token is stored in `localStorage`
   - `FcmRegistration` component detects the token
   - Requests notification permission
   - Gets FCM token from Firebase
   - Saves token to backend via `POST /api/user/fcm-token`

2. **On Auto-Login** (`GET /api/auth/me`):
   - User opens app with existing JWT token
   - `FcmRegistration` component detects the token
   - Same flow as above

3. **On Order Status Change**:
   - Delivery boy updates order status
   - Backend fetches user with `fcmToken`
   - Sends FCM push notification to user's device
   - Falls back to SMS if FCM token not available or push fails

## Usage in Notification Service

The notification service already uses the user's `fcmToken` when sending notifications:

```typescript
// In backend/src/services/notificationService.ts
export async function notifyUserOnStatusChange(
  user: { id: string; name: string; phone: string | null; fcmToken?: string | null },
  order: { id: string; orderNumber: string; status: string; items?: Array<...> },
  status: string
): Promise<void> {
  // ... checks fcmToken and sends push notification
}
```

All order controllers that notify users have been updated to include `fcmToken` when fetching user data.

## Notes

- Registration happens automatically when user is logged in
- Permission is requested only once (browser remembers the choice)
- Token is refreshed automatically (Firebase handles this)
- Token is saved to backend whenever it changes
- If permission is denied, registration silently fails (no error shown to user)
- FCM tokens are nullable (can be null if user hasn't registered)

