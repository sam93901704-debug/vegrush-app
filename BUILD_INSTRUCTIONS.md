# APK Build Instructions

This guide provides step-by-step instructions for building a signed release APK for Android.

## Prerequisites

1. **Java JDK 11+** installed and configured
2. **Android Studio** installed
3. **Android SDK** installed (API level 33+)
4. **Node.js 18+** installed
5. **Next.js app built** (`npm run build`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Capacitor (First Time Only)

```bash
# Install Capacitor CLI globally (optional)
npm install -g @capacitor/cli

# Or use npx
npx cap init

# Add Android platform
npx cap add android

# Build and sync
npm run build
npx cap sync
```

### 3. Generate Release Keystore

**Option A: Using Script (Recommended)**

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/generate-keystore.sh

# Run script
./scripts/generate-keystore.sh
```

**Option B: Manual Generation**

```bash
keytool -genkey -v \
  -keystore android/app/keystore/release.keystore \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Your App, OU=Development, O=Your Company, L=City, ST=State, C=IN"
```

**Important Keystore Information:**

- **Keystore Password**: Password to access the keystore file
- **Key Password**: Password for the specific key alias (can be same as keystore password)
- **Alias**: Name of the key (default: `release`)
- **Validity**: Number of days the certificate is valid (default: 10000 days ≈ 27 years)

⚠️ **SECURITY WARNING**: 
- Never commit keystore files or passwords to version control
- Store passwords securely (password manager)
- Backup keystore file in a secure location
- If you lose the keystore, you **cannot update** your app on Play Store

### 4. Configure Gradle Signing

Create `android/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=release
storeFile=keystore/release.keystore
```

Update `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing configuration
    
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
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 5. Build Release APK

**Option A: Using Script**

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/build-apk.sh

# Build release APK
./scripts/build-apk.sh release

# Or build debug APK
./scripts/build-apk.sh debug
```

**Option B: Manual Build**

```bash
# Build Next.js app
npm run build

# Sync Capacitor
npx cap sync

# Build APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### 6. Verify APK Signature

```bash
jarsigner -verify -verbose -certs app-release.apk
```

Or use `apksigner`:

```bash
apksigner verify --verbose app-release.apk
```

### 7. Build App Bundle (AAB) for Play Store

```bash
cd android
./gradlew bundleRelease

# AAB location: android/app/build/outputs/bundle/release/app-release.aab
```

## Build Types

### Debug Build

- **Purpose**: Development and testing
- **Signing**: Automatic debug signing
- **Command**: `./gradlew assembleDebug`
- **Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

- **Purpose**: Production deployment
- **Signing**: Requires release keystore
- **Command**: `./gradlew assembleRelease`
- **Location**: `android/app/build/outputs/apk/release/app-release.apk`

### App Bundle (AAB)

- **Purpose**: Google Play Store upload
- **Signing**: Requires release keystore
- **Command**: `./gradlew bundleRelease`
- **Location**: `android/app/build/outputs/bundle/release/app-release.aab`

## Troubleshooting

### Issue: "keystore.properties not found"

**Solution**: Create `android/keystore.properties` file with your keystore credentials.

### Issue: "Keystore was tampered with, or password was incorrect"

**Solution**: 
- Verify keystore password in `keystore.properties`
- Check keystore file path is correct
- Ensure keystore file is not corrupted

### Issue: "Execution failed for task ':app:signReleaseBundle'"

**Solution**:
- Ensure `keystore.properties` is properly formatted
- Check all required fields are present (storePassword, keyPassword, keyAlias, storeFile)
- Verify keystore file exists at specified path

### Issue: APK not installable on device

**Solution**:
- Check if device allows installation from unknown sources
- Verify APK signature is valid
- Ensure minSdkVersion is compatible with device Android version

## Continuous Integration (CI/CD)

For automated builds in CI/CD:

1. **Store keystore securely**: Use CI/CD secrets management
2. **Base64 encode keystore**: For easier storage in environment variables
3. **Create keystore in CI**: Decode and create keystore file during build
4. **Never commit**: Keep keystore files out of version control

### Example GitHub Actions

```yaml
- name: Setup Java
  uses: actions/setup-java@v3
  with:
    java-version: '11'
    distribution: 'temurin'

- name: Create keystore
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/keystore/release.keystore

- name: Create keystore.properties
  run: |
    echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" > android/keystore.properties
    echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> android/keystore.properties
    echo "keyAlias=release" >> android/keystore.properties
    echo "storeFile=keystore/release.keystore" >> android/keystore.properties

- name: Build APK
  run: |
    npm run build
    npx cap sync
    cd android && ./gradlew assembleRelease
```

## Additional Resources

- [Android App Signing Guide](https://developer.android.com/studio/publish/app-signing)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Google Play Console](https://play.google.com/console)

## Notes

- Always test the signed APK before distribution
- Keep keystore backups in multiple secure locations
- Document keystore information (alias, validity) for future reference
- Use different keystores for development, staging, and production if needed

