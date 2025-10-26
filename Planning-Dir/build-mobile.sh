#!/bin/bash

# MobileToolsBox Mobile Build Script
echo "🚀 Building MobileToolsBox for Mobile App Stores..."

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the web application for production
echo "🔨 Building production web app..."
npm run build

# Check if build was successful
if [ ! -d "client/dist" ]; then
    echo "❌ Build failed - client/dist directory not found"
    exit 1
fi

echo "✅ Web build completed successfully"

# Sync with Capacitor platforms
echo "🔄 Syncing with mobile platforms..."
npx cap sync

echo "📱 Mobile platforms synced successfully"

# Generate app icons and splash screens
echo "🎨 Generating app icons and splash screens..."
if command -v capacitor-assets &> /dev/null; then
    npx capacitor-assets generate
    echo "✅ App assets generated"
else
    echo "⚠️  Install @capacitor/assets to auto-generate icons: npm install @capacitor/assets --save-dev"
fi

echo ""
echo "🎉 Mobile build preparation complete!"
echo ""
echo "Next steps:"
echo "1. For iOS: npx cap open ios (requires macOS + Xcode)"
echo "2. For Android: npx cap open android (requires Android Studio)"
echo ""
echo "See MOBILE_DEPLOYMENT_GUIDE.md for detailed deployment instructions"