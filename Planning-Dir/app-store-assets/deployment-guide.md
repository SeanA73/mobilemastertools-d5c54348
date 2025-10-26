# MobileToolsBox Mobile App Deployment Guide

## Prerequisites

### For Android (Google Play Store)
1. **Android Studio** - Download from https://developer.android.com/studio
2. **Google Play Console Account** - $25 one-time registration fee
3. **Java Development Kit (JDK) 11+**
4. **Android SDK** (installed with Android Studio)

### For iOS (App Store)
1. **Xcode** - Available on Mac App Store (macOS required)
2. **Apple Developer Account** - $99/year subscription
3. **macOS** - Required for iOS development

## Step 1: Build the Mobile App

```bash
# Build the web app for mobile
npm run build

# Initialize Capacitor and add platforms
./mobile-build.sh
```

## Step 2: Android Deployment

### Configure Android App
1. Open Android Studio: `npx cap open android`
2. Update `android/app/src/main/AndroidManifest.xml`:
   - Set proper app permissions
   - Configure app icons and splash screens
3. Update `android/app/build.gradle`:
   - Set version code and version name
   - Configure signing for release builds

### Create Signed APK/AAB
1. In Android Studio: Build > Generate Signed Bundle/APK
2. Create a new keystore or use existing one
3. Build signed App Bundle (.aab) for Play Store

### Google Play Console
1. Create new app at https://play.google.com/console
2. Complete store listing (use content from app-description.md)
3. Upload app bundle (.aab file)
4. Configure pricing (Free)
5. Add screenshots and promotional graphics
6. Submit for review

## Step 3: iOS Deployment

### Configure iOS App
1. Open Xcode: `npx cap open ios`
2. Configure App ID, Bundle Identifier, and Team
3. Update Info.plist with proper permissions and metadata
4. Configure app icons and launch screens

### App Store Connect
1. Create app at https://appstoreconnect.apple.com
2. Archive and upload build using Xcode
3. Complete app information (use content from app-description.md)
4. Add screenshots and app preview videos
5. Submit for App Store review

## Step 4: Required Assets

### App Icons
- Android: 48x48, 72x72, 96x96, 144x144, 192x192px
- iOS: 57x57, 114x114, 120x120, 180x180, 1024x1024px

### Screenshots
- Android: 1080x1920, 1080x2340 (Phone), 1200x1920 (Tablet)
- iOS: Various sizes for different devices

### Privacy Policy & Terms
- Required for both stores
- Must be accessible via public URL

## Step 5: App Store Optimization

### Keywords (30 chars max for iOS)
productivity,todo,notes,timer

### Categories
- Primary: Productivity
- Secondary: Business or Utilities

### Age Rating
4+ (No objectionable content)

## Step 6: Monetization Setup

Since the app is free with optional donations:
- Set price to "Free" on both stores
- Configure in-app purchases for coffee donations
- Ensure Stripe integration works on mobile

## Step 7: Post-Launch

### Updates
- Use `npm run cap:sync` to update native apps
- Increment version numbers for each release
- Test thoroughly on both platforms

### Analytics
- Integrate Google Analytics or Firebase
- Monitor app performance and user engagement
- Track donation conversion rates

## Important Notes

1. **Testing**: Test on real devices before submitting
2. **Review Guidelines**: Follow each platform's review guidelines strictly
3. **Permissions**: Only request necessary permissions
4. **Performance**: Ensure app loads quickly and works offline
5. **Accessibility**: Support screen readers and accessibility features

## Estimated Timeline
- Development/Setup: 1-2 days
- Store Review Process: 1-7 days (Google), 1-3 days (Apple)
- Total: 1-2 weeks from start to live on stores