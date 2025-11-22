#!/bin/bash

# Capacitor Initialization Script
# This script initializes Capacitor for the Next.js app

set -e

echo "🚀 Initializing Capacitor..."

# Check if Capacitor is already initialized
if [ -f "capacitor.config.ts" ]; then
    echo "✅ Capacitor is already configured"
    read -p "Do you want to reinitialize? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build Next.js app first
echo "🏗️  Building Next.js app..."
npm run build

# Initialize Capacitor (if not already done)
if [ ! -d "android" ]; then
    echo "📱 Adding Android platform..."
    npx cap add android
else
    echo "✅ Android platform already exists"
fi

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync

echo "✅ Capacitor initialization complete!"
echo ""
echo "Next steps:"
echo "1. Update capacitor.config.ts with your backend URLs"
echo "2. Configure Firebase for push notifications"
echo "3. Run: npx cap open android"
echo "4. Build and run in Android Studio"

