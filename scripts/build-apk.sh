#!/bin/bash

# APK Build Script
# This script builds a signed release APK

set -e

BUILD_TYPE=${1:-release}  # debug or release

echo "🔨 Building $BUILD_TYPE APK..."

# Check if we're in the correct directory
if [ ! -d "android" ]; then
    echo "❌ Error: android directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

# Build Next.js app first
echo "🏗️  Building Next.js app..."
npm run build

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync

# Navigate to Android directory
cd android

# Build APK
if [ "$BUILD_TYPE" = "release" ]; then
    echo "📦 Building release APK with signing..."
    
    # Check if keystore exists
    if [ ! -f "app/keystore/release.keystore" ]; then
        echo "⚠️  Warning: Release keystore not found"
        echo "Building unsigned release APK..."
        ./gradlew assembleRelease
    else
        echo "✅ Using release keystore for signing"
        ./gradlew assembleRelease
    fi
    
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    echo "📦 Building debug APK..."
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

# Return to project root
cd ..

if [ -f "android/$APK_PATH" ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: android/$APK_PATH"
    
    # Copy to root for easier access
    cp "android/$APK_PATH" "app-${BUILD_TYPE}.apk"
    echo "📋 Also copied to: app-${BUILD_TYPE}.apk"
else
    echo "❌ Error: APK not found at android/$APK_PATH"
    exit 1
fi

