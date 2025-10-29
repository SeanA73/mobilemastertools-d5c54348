# 📱 iOS Deployment Guide

Complete guide to building and deploying MobileToolsBox to Apple App Store.

## Prerequisites

- ✅ **macOS computer** (Required for iOS builds)
- ✅ **Xcode 15+** installed from Mac App Store
- ✅ **Apple Developer Account** ($99/year)
- ✅ Built web application (`dist/public` folder)
- ✅ App icon ready (`resources/icon.png` at 1024x1024)

## Important Note

⚠️ **iOS apps can ONLY be built on macOS** with Xcode. You cannot build iOS apps on Windows.

If you're on Windows, you'll need to:
- Use a Mac computer, or
- Rent a macOS cloud service (MacStadium, MacinCloud), or
- Use a CI/CD service with macOS runners (GitHub Actions, CircleCI)

## Part 1: iOS Platform Setup

### Add iOS Platform (First Time Only)

On your Mac, in the project directory:

```bash
# Add iOS platform
npx cap add ios
```

This creates the `ios/` directory with your Xcode project.

## Part 2: Build Preparation

### Generate App Icons and Splash Screens

```bash
# Ensure resources/icon.png exists (1024x1024 PNG)
# Ensure resources/splash.png exists (2732x2732 PNG)

# Generate all required assets
npx @capacitor/assets generate
```

### Build Web Application

```bash
# Build production web app
npm run build
```

### Sync with iOS

```bash
# Sync web app to iOS project
npx cap sync ios
```

## Part 3: Xcode Configuration

### Open Project in Xcode

```bash
# Open Xcode project
npx cap open ios
```

This opens Xcode with your iOS project.

### Project Settings

1. **Select Project** (blue icon) in left sidebar
2. **Select Target** "App" under Targets
3. **General Tab**:
   - **Display Name**: MobileToolsBox
   - **Bundle Identifier**: com.mobiletoolsbox.app
   - **Version**: 1.0.0
   - **Build**: 1
   - **Deployment Info**:
     - **iOS**: 13.0 or higher
     - **iPhone** and **iPad** both checked

### Signing & Capabilities

1. **Signing Tab**:
   - Check "Automatically manage signing"
   - **Team**: Select your Apple Developer Team
   - Wait for provisioning profile to be created
   - Verify "Signing Certificate" shows your name

2. **Capabilities** (if needed):
   - Click "+ Capability"
   - Add "Background Modes" (for audio, if using voice recordings)
   - Add "Push Notifications" (for future features)

### App Icons

1. **Assets Tab**:
   - Click "AppIcon" in Assets.xcassets
   - Verify all icon sizes are present (from assets generation)
   - If missing, drag `resources/icon.png` to AppIcon

### Launch Screen

1. **LaunchScreen.storyboard**:
   - Customize splash screen colors/logo if needed
   - Or use the generated splash screen from assets

## Part 4: Build & Archive

### Select Build Target

1. In Xcode toolbar, click device selector
2. Choose "**Any iOS Device (arm64)**"
3. Do NOT select a simulator

### Create Archive

1. **Product** menu → **Archive**
2. Wait for build to complete (5-15 minutes)
3. Organizer window will open automatically

### Troubleshooting Build Errors

**Code Signing Error**:
- Verify your Apple Developer account is active
- Check Team selection in signing settings
- Try manual signing instead of automatic

**Build Failed**:
- Clean build folder: Product → Clean Build Folder
- Retry archive

## Part 5: App Store Connect Setup

### Create App Listing

1. Go to https://appstoreconnect.apple.com
2. Click "**My Apps**"
3. Click "**+**" → "**New App**"
4. Fill in:
   - **Platform**: iOS
   - **Name**: MobileToolsBox
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.mobiletoolsbox.app
   - **SKU**: mobiletoolsbox (or any unique identifier)
   - **User Access**: Full Access
5. Click "Create"

### App Information

1. **Category**:
   - **Primary**: Productivity
   - **Secondary**: Utilities

2. **Content Rights**:
   - "No, it does not contain, show, or access third-party content"

3. **Age Rating**:
   - Complete questionnaire
   - Expected rating: 4+

### Pricing and Availability

1. **Price**: Free
2. **Availability**: All countries/regions
3. Save

## Part 6: App Store Information

### Version Information

1. **What's New in This Version** (Release Notes):
   ```
   Welcome to MobileToolsBox v1.0!

   ✨ NEW FEATURES:
   • Complete productivity suite with 20+ tools
   • Todo management and note taking
   • Habit tracking with streaks
   • Flashcards for studying
   • Pomodoro timer for focus
   • Voice recordings
   • Unit converter
   • Password generator
   • QR code scanner
   • World clock
   • IQ tester
   • Calculator
   • Project timer
   • File converter
   • Beautiful theme customization

   All features completely free!
   Start your productivity journey today! 🚀
   ```

### App Details

1. **Name**: MobileToolsBox (30 chars max)
2. **Subtitle**: All-in-One Productivity Suite (30 chars max)
3. **Promotional Text** (170 chars):
   ```
   Transform your productivity with 20+ powerful tools. Manage tasks, track habits, take notes, and more - all in one beautiful app. Completely free!
   ```

4. **Description** (4000 chars max):
   ```
   MobileToolsBox is your ultimate productivity companion, featuring 20+ powerful tools to help you stay organized, focused, and efficient.

   ✅ COMPLETE PRODUCTIVITY SUITE

   📋 Todo Management
   Organize your tasks with priorities, due dates, tags, and smart sorting. Never miss a deadline.

   📝 Note Taking
   Capture ideas with a rich text editor supporting markdown, formatting, and organization.

   🎯 Habit Tracking
   Build positive habits with daily tracking, streaks, and detailed analytics.

   🃏 Flashcards
   Study efficiently with spaced repetition and category organization.

   🎤 Voice Recordings
   Quick audio notes and reminders with easy playback and management.

   ⏱️ Pomodoro Timer
   Focus sessions with customizable work/break intervals and statistics.

   🔢 Unit Converter
   Convert between units across multiple categories with precision.

   🔐 Password Generator
   Create secure, memorable passwords with multiple generation modes.

   🌍 World Clock
   Track time across multiple time zones simultaneously.

   🧠 IQ Tester
   Challenge your cognitive abilities with professional IQ test questions.

   🔢 Calculator
   Built-in scientific calculator for quick calculations.

   📷 QR Code Scanner
   Scan and generate QR codes with history and batch processing.

   📊 Project Timer
   Track time spent on different projects with detailed analytics.

   📁 File Converter
   Convert between file formats with batch processing.

   🎨 Theme Customization
   Personalize your experience with custom themes, colors, and fonts.

   💰 COMPLETELY FREE
   All features are 100% free with no subscriptions, no ads, no hidden costs. Optional donations support development.

   🔒 PRIVACY FIRST
   Your data stays on your device. We don't collect unnecessary information or share your data.

   ⚡ KEY BENEFITS
   • All-in-one solution - no need for multiple apps
   • Beautiful, modern interface
   • Fast and responsive
   • Works offline
   • Regular updates
   • Active development

   👥 PERFECT FOR
   • Students managing coursework
   • Professionals organizing work
   • Anyone improving productivity
   • Users wanting an all-in-one solution

   Download MobileToolsBox now and experience the difference! 🎉
   ```

5. **Keywords** (100 chars max, comma-separated):
   ```
   productivity,todo,notes,habits,timer,flashcards,tools,organize,focus,tracker
   ```

6. **Support URL**: https://yourdomain.com/support
7. **Marketing URL**: https://yourdomain.com

### Screenshots

You need to create screenshots for:

**6.7" Display (iPhone 14 Pro Max)** - REQUIRED:
- Size: 1290 x 2796 pixels
- Minimum: 3 screenshots
- Maximum: 10 screenshots
- Show: Dashboard, Todos, Notes, Habits, Timer, Converter

**6.5" Display (iPhone 11 Pro Max)**:
- Size: 1242 x 2688 pixels

**5.5" Display (iPhone 8 Plus)**:
- Size: 1242 x 2208 pixels

**iPad Pro (12.9")** - OPTIONAL but recommended:
- Size: 2048 x 2732 pixels

**How to Create Screenshots**:
1. Run app in iPhone simulator with desired size
2. Capture: Cmd + S
3. Edit/add text overlays if desired
4. Upload to App Store Connect

## Part 7: Upload Build

### In Xcode Organizer

1. After archiving, Organizer window appears
2. Select your archive
3. Click "**Distribute App**"
4. Select "**App Store Connect**"
5. Click "**Upload**"
6. Select distribution options:
   - Upload symbols: Yes
   - Manage version: Automatically
7. Click "**Upload**"
8. Wait for upload (5-20 minutes)

### Verify Upload

1. Go to App Store Connect
2. Your app → **TestFlight** or **App Store**
3. Wait for "**Processing**" to complete (30 mins - 2 hours)
4. Check for any warnings or issues

## Part 8: Submit for Review

### Add Build to Version

1. In App Store Connect, go to your app
2. Click on version "**1.0 Prepare for Submission**"
3. Scroll to "**Build**" section
4. Click "**+**" to add build
5. Select your uploaded build
6. Save

### App Review Information

1. **Contact Information**:
   - First name, last name
   - Phone number
   - Email address

2. **Notes for Reviewer** (Optional):
   ```
   MobileToolsBox is a free productivity app with 20+ tools.
   No account required to use the app.
   All features are free.
   
   To test, simply open the app and explore the tools.
   ```

3. **Sign-in required**: No
   - If you want accounts optional: Provide demo account

### Submit

1. Review all information one final time
2. Click "**Add for Review**" at top right
3. Click "**Submit for Review**"
4. Wait for review (typically 24-48 hours)

## Part 9: Review Process

### What to Expect

- **In Review**: Apple is testing your app (24-48 hours)
- **Pending Developer Release**: Approved! Ready to publish
- **Ready for Sale**: Live on App Store!
- **Rejected**: Address issues and resubmit

### Common Rejection Reasons

1. **Crashes**: Test thoroughly before submission
2. **Missing features**: Ensure all described features work
3. **Privacy policy**: Must be accessible and accurate
4. **Metadata**: Screenshots must match actual app
5. **Guidelines violation**: Review Apple's guidelines

### If Rejected

1. Read rejection message carefully
2. Address all mentioned issues
3. Update build if needed
4. Resubmit for review

## Part 10: Post-Approval

### Release Your App

If auto-release is not enabled:
1. Click "**Release this version**"
2. App goes live within 24 hours

### Monitor

- **Ratings & Reviews**: Respond to user feedback
- **Analytics**: Check downloads and usage
- **Crash Reports**: Fix any reported issues
- **Sales & Trends**: Monitor downloads

### Future Updates

For version 1.0.1, 1.1.0, etc.:

1. Update version in Xcode
2. Build new archive
3. Upload to App Store Connect
4. Create new version in App Store Connect
5. Add "What's New" notes
6. Submit for review

## Alternative: Build on Windows Using CI/CD

### GitHub Actions Approach

Create `.github/workflows/ios-build.yml`:

```yaml
name: iOS Build

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npx cap sync ios
      - run: npx cap build ios
```

Then trigger the workflow manually from GitHub.

## Support Resources

- **Apple Developer**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/

## Timeline

- **Setup & Build**: 2-3 hours (first time)
- **Upload**: 30 minutes
- **Processing**: 30 mins - 2 hours
- **Review**: 24-48 hours
- **Total**: 2-4 days to live on App Store

---

**Note**: Since you're on Windows, you'll need access to a Mac to complete iOS deployment. Consider using a cloud Mac service or CI/CD if you don't have a Mac available.

