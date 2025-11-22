# Capacitor Quick Start Guide

This is a quick reference guide for setting up Capacitor with your Next.js app. For detailed instructions, see [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md).

## Prerequisites

- Node.js 18+
- Java JDK 11+
- Android Studio (latest)
- Android SDK (API 33+)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Capacitor

```bash
# Initialize Capacitor (already configured, but you can verify)
npx cap init

# Add Android platform
npx cap add android
```

### 3. Build and Sync

```bash
# Build Next.js app
npm run build

# Sync with Capacitor
npx cap sync
```

### 4. Open in Android Studio

```bash
npx cap open android
```

## Configuration

### Update Backend URL

Edit `capacitor.config.ts` and update `allowNavigation` with your production backend URL:

```typescript
allowNavigation: [
  'https://your-backend-api.railway.app',
  // ... other URLs
]
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-key
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Build APK

### Debug Build

```bash
npm run android:build:debug
```

### Release Build (Requires Keystore)

1. **Generate Keystore**:
   ```bash
   chmod +x scripts/generate-keystore.sh
   ./scripts/generate-keystore.sh
   ```

2. **Build Release APK**:
   ```bash
   chmod +x scripts/build-apk.sh
   ./scripts/build-apk.sh release
   ```

For detailed build instructions, see [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md).

## Push Notifications (FCM)

1. **Firebase Setup**:
   - Create Firebase project
   - Add Android app
   - Download `google-services.json`
   - Place in `android/app/`

2. **Configure Android**:
   - Follow instructions in `android/fcm-setup.md`
   - Update `android/app/build.gradle`
   - Update `AndroidManifest.xml`

3. **Test Notifications**:
   - Build and run app
   - Check logs for FCM token
   - Send test notification from Firebase Console

## Important Files

- `capacitor.config.ts` - Capacitor configuration
- `next.config.js` - Next.js configuration (static export)
- `android/` - Android project directory
- `out/` - Next.js static export output

## Common Commands

```bash
# Build Next.js app
npm run build

# Sync Capacitor
npm run cap:sync

# Open Android Studio
npm run cap:open:android

# Copy web assets
npm run cap:copy
```

## Troubleshooting

### "WebDir does not exist"
→ Run `npm run build` first

### Backend API not reachable
→ Update `allowNavigation` in `capacitor.config.ts`

### Notifications not working
→ Check `android/fcm-setup.md` for FCM configuration

For more troubleshooting tips, see [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md).

