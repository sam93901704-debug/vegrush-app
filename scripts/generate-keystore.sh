#!/bin/bash

# Keystore Generation Script
# This script helps you generate a release keystore for Android signing

set -e

echo "🔐 Android Keystore Generator"
echo "=============================="
echo ""

# Check if Java keytool is available
if ! command -v keytool &> /dev/null; then
    echo "❌ Error: keytool not found"
    echo "Please install Java JDK (version 11 or higher)"
    exit 1
fi

# Prompt for keystore details
read -p "Enter keystore alias (default: release): " KEYSTORE_ALIAS
KEYSTORE_ALIAS=${KEYSTORE_ALIAS:-release}

read -p "Enter keystore password (min 6 characters): " KEYSTORE_PASSWORD
if [ -z "$KEYSTORE_PASSWORD" ]; then
    echo "❌ Error: Password cannot be empty"
    exit 1
fi

read -p "Enter key password (can be same as keystore password): " KEY_PASSWORD
KEY_PASSWORD=${KEY_PASSWORD:-$KEYSTORE_PASSWORD}

read -p "Enter validity in days (default: 10000): " VALIDITY_DAYS
VALIDITY_DAYS=${VALIDITY_DAYS:-10000}

# Create keystore directory
mkdir -p android/app/keystore

KEYSTORE_PATH="android/app/keystore/release.keystore"

# Check if keystore already exists
if [ -f "$KEYSTORE_PATH" ]; then
    read -p "⚠️  Keystore already exists. Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 0
    fi
fi

# Generate keystore
echo "🔨 Generating keystore..."
keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEYSTORE_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY_DAYS" \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=Your App, OU=Development, O=Your Company, L=City, ST=State, C=IN"

# Create keystore.properties file
PROPERTIES_FILE="android/keystore.properties"

if [ -f "$PROPERTIES_FILE" ]; then
    read -p "⚠️  keystore.properties already exists. Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⚠️  Skipping keystore.properties creation"
        exit 0
    fi
fi

cat > "$PROPERTIES_FILE" << EOF
storePassword=$KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEYSTORE_ALIAS
storeFile=keystore/release.keystore
EOF

echo "✅ Keystore generated successfully!"
echo ""
echo "📋 Keystore details:"
echo "   Location: $KEYSTORE_PATH"
echo "   Alias: $KEYSTORE_ALIAS"
echo "   Validity: $VALIDITY_DAYS days"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Keep your keystore and passwords secure"
echo "   2. Never commit keystore files to version control"
echo "   3. If you lose the keystore, you cannot update your app on Play Store"
echo "   4. Backup the keystore in a secure location"
echo ""
echo "✅ Next steps:"
echo "   1. Review android/app/build.gradle signing configuration"
echo "   2. Build release APK: npm run android:build"
echo "   3. Verify APK signature: jarsigner -verify app-release.apk"

