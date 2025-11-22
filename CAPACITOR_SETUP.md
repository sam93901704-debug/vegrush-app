# Capacitor Setup Guide

This guide will help you set up Capacitor for Android mobile app development.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Java JDK** (v11 or higher)
3. **Android Studio** (latest version)
4. **Android SDK** (API level 33 or higher)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Capacitor (Already Done)

Capacitor has been initialized with:
- **App ID**: `com.yourapp.freshveggies`
- **App Name**: `Fresh Veggies`
- **Web Directory**: `out` (Next.js static export)

### 3. Add Android Platform

```bash
npm run cap:add:android
```

Or manually:
```bash
npx cap add android
```

### 4. Build Next.js App

Before syncing with Capacitor, build your Next.js app:

```bash
npm run build
```

This will generate the static files in the `out` directory.

### 5. Sync Capacitor

After building, sync the web assets with Capacitor:

```bash
npm run cap:sync
```

Or manually:
```bash
npx cap sync
```

### 6. Open in Android Studio

```bash
npm run cap:open:android
```

Or manually:
```bash
npx cap open android
```

## Configuration

### Backend API URL

Update `capacitor.config.ts` with your production backend URL:

```typescript
allowNavigation: [
  'https://your-backend-api.railway.app',
  // ... other URLs
]
```

### Supabase Configuration

Supabase URLs are already configured in `allowNavigation`. Make sure to update any hardcoded URLs in your app code to use environment variables.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-firebase-vapid-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Push Notifications (FCM)

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add an Android app to your Firebase project
3. Download `google-services.json` and place it in `android/app/`
4. Configure FCM in your Firebase project

### Android Configuration

1. Open Android project in Android Studio
2. Ensure Firebase dependencies are added (see `android/app/build.gradle`)
3. Build and run the app

## Building APK

### Debug Build

```bash
npm run android:build:debug
```

The APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build with Keystore

#### 1. Generate Keystore

```bash
keytool -genkey -v -keystore android/app/keystore/release.keystore -alias your-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Store your keystore password and alias securely. You cannot recover them if lost.

#### 2. Create keystore.properties

Create `android/keystore.properties` (add to `.gitignore`):

```properties
storePassword=your-keystore-password
keyPassword=your-keystore-alias-password
keyAlias=your-alias
storeFile=keystore/release.keystore
```

#### 3. Update android/app/build.gradle

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

#### 5. Build App Bundle (for Play Store)

```bash
cd android
./gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Development Workflow

1. **Make changes** to your Next.js app in the `app` directory
2. **Build the app**: `npm run build`
3. **Sync with Capacitor**: `npm run cap:sync`
4. **Test in Android Studio**: `npm run cap:open:android`

## Troubleshooting

### Issue: "Module not found" errors

**Solution**: Make sure you've run `npm install` and all dependencies are installed.

### Issue: "WebDir does not exist"

**Solution**: Build your Next.js app first with `npm run build` before syncing.

### Issue: Backend API not reachable

**Solution**: 
- For development, use `http://10.0.2.2:4000` instead of `localhost:4000` (Android emulator)
- For production, ensure your backend URL is in `allowNavigation` array
- Check that `cleartext: true` is set for HTTP connections

### Issue: Push notifications not working

**Solution**:
- Verify `google-services.json` is in `android/app/`
- Check Firebase project configuration
- Ensure FCM dependencies are in `android/app/build.gradle`
- Verify FCM token is being generated and sent to backend

### Issue: Supabase images not loading

**Solution**: Ensure Supabase URLs are in the `allowNavigation` array in `capacitor.config.ts`

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)

## Notes

- The `out` directory contains the static export from Next.js
- Always run `npm run build` before `npm run cap:sync`
- The Android project is generated in the `android/` directory
- Never commit `keystore.properties` or `.keystore` files to version control

