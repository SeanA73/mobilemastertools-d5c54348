#!/bin/bash

# MobileToolsBox Production Build Script
# This script builds the application for production deployment

set -e  # Exit on error

echo "🚀 MobileToolsBox Production Build Script"
echo "======================================"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy env.production.template to .env.production and fill in your values."
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf client/dist
echo "✅ Clean complete"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Run type check
echo "🔍 Running type check..."
npm run check
echo "✅ Type check passed"
echo ""

# Build the application
echo "🏗️  Building application..."
npm run build
echo "✅ Build complete"
echo ""

# Verify build output
if [ ! -d "dist/public" ]; then
    echo "❌ Error: dist/public directory not found!"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js not found!"
    exit 1
fi

echo "✅ Build verification passed"
echo ""

echo "🎉 Production build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test the build locally: NODE_ENV=production node dist/index.js"
echo "2. Deploy to your VPS server"
echo "3. Start with PM2: pm2 start ecosystem.config.js"
echo ""

