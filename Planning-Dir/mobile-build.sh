#!/bin/bash

# MobileToolsBox Mobile Build Script
# This script builds and prepares the mobile apps for store submission

echo "🚀 MobileToolsBox Mobile Build Script"
echo "================================="

# Check if Capacitor is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm/npx not found. Please install Node.js"
    exit 1
fi

# Function to build web app
build_web() {
    echo "📦 Building web application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Web build failed"
        exit 1
    fi
    echo "✅ Web build completed"
}

# Function to sync with mobile platforms
sync_mobile() {
    echo "🔄 Syncing with mobile platforms..."
    npx cap sync
    if [ $? -ne 0 ]; then
        echo "❌ Mobile sync failed"
        exit 1
    fi
    echo "✅ Mobile sync completed"
}

# Function to generate app icons and splash screens
generate_assets() {
    echo "🎨 Generating app icons and splash screens..."
    
    # Install assets plugin if not present
    if ! npm list @capacitor/assets &> /dev/null; then
        echo "Installing @capacitor/assets..."
        npm install @capacitor/assets --save-dev
    fi
    
    # Generate assets
    npx capacitor-assets generate
    if [ $? -ne 0 ]; then
        echo "⚠️  Asset generation failed - continuing with manual icons"
    else
        echo "✅ Assets generated successfully"
    fi
}

# Function to build iOS
build_ios() {
    echo "🍎 Preparing iOS build..."
    
    # Check if iOS platform exists
    if [ ! -d "ios" ]; then
        echo "Adding iOS platform..."
        npx cap add ios
    fi
    
    # Build iOS
    npx cap build ios
    if [ $? -ne 0 ]; then
        echo "❌ iOS build failed"
        exit 1
    fi
    
    echo "✅ iOS build completed"
    echo "📱 Next steps for iOS:"
    echo "   1. Run: npx cap open ios"
    echo "   2. In Xcode, select 'Any iOS Device'"
    echo "   3. Product → Archive"
    echo "   4. Upload to App Store Connect"
}

# Function to build Android
build_android() {
    echo "🤖 Preparing Android build..."
    
    # Check if Android platform exists
    if [ ! -d "android" ]; then
        echo "Adding Android platform..."
        npx cap add android
    fi
    
    # Build Android
    npx cap build android
    if [ $? -ne 0 ]; then
        echo "❌ Android build failed"
        exit 1
    fi
    
    echo "✅ Android build completed"
    echo "📱 Next steps for Android:"
    echo "   1. Run: npx cap open android"
    echo "   2. In Android Studio, Build → Generate Signed Bundle/APK"
    echo "   3. Upload AAB to Google Play Console"
}

# Main execution
case "$1" in
    "ios")
        build_web
        sync_mobile
        generate_assets
        build_ios
        ;;
    "android")
        build_web
        sync_mobile
        generate_assets
        build_android
        ;;
    "both"|"")
        build_web
        sync_mobile
        generate_assets
        build_ios
        build_android
        ;;
    "assets")
        generate_assets
        ;;
    *)
        echo "Usage: $0 [ios|android|both|assets]"
        echo ""
        echo "Commands:"
        echo "  ios      - Build for iOS only"
        echo "  android  - Build for Android only"
        echo "  both     - Build for both platforms (default)"
        echo "  assets   - Generate app icons and splash screens only"
        exit 1
        ;;
esac

echo ""
echo "🎉 Build process completed!"
echo "📖 See MOBILE_DEPLOYMENT_GUIDE.md for detailed submission instructions"