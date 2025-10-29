#!/bin/bash

# MobileToolsBox Mobile Apps Build Script
# This script prepares mobile apps for iOS and Android

set -e  # Exit on error

echo "📱 MobileToolsBox Mobile Apps Build Script"
echo "======================================="
echo ""

# Check for required tools
command -v npx >/dev/null 2>&1 || { echo "❌ Error: npx not found. Please install Node.js"; exit 1; }

# Build web app first
echo "🏗️  Building web application..."
npm run build
echo "✅ Web build complete"
echo ""

# Generate app icons and splash screens
echo "🎨 Generating app icons and splash screens..."
if [ ! -f "resources/icon.png" ]; then
    echo "⚠️  Warning: resources/icon.png not found. Using default icon."
fi
npx @capacitor/assets generate
echo "✅ Assets generated"
echo ""

# iOS Build
echo "📱 iOS Configuration"
echo "-------------------"
npx cap sync ios
echo "✅ iOS synced"
echo ""
echo "To build iOS app:"
echo "1. Run: npx cap open ios"
echo "2. In Xcode: Select 'Any iOS Device'"
echo "3. Product → Archive"
echo "4. Distribute to App Store Connect"
echo ""

# Android Build
echo "🤖 Android Configuration"
echo "------------------------"
npx cap sync android
echo "✅ Android synced"
echo ""

# Check for Android signing key
if [ ! -f "android/key.properties" ]; then
    echo "⚠️  Warning: android/key.properties not found!"
    echo "To generate signing key, run:"
    echo "  keytool -genkey -v -keystore mobiletoolsbox-release-key.keystore \\"
    echo "    -alias mobiletoolsbox -keyalg RSA -keysize 2048 -validity 10000"
    echo ""
    echo "Then create android/key.properties from the template"
    echo ""
fi

echo "To build Android release AAB:"
echo "1. cd android"
echo "2. ./gradlew bundleRelease"
echo "3. AAB will be at: app/build/outputs/bundle/release/app-release.aab"
echo ""

echo "🎉 Mobile apps prepared successfully!"
echo ""

