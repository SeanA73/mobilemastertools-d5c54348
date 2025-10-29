# 🚀 Quick Build Guide - MobileToolsBox

## Fast Commands to Build Your App

### For Android (Windows)

```powershell
# Build release AAB for Google Play
.\build-android.ps1
```

Output: `android\app\build\outputs\bundle\release\app-release.aab`

---

### For Web/VPS Deployment

```bash
# Build for production
npm run build

# Start locally to test
npm start

# On VPS: Deploy with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

### For iOS (Mac Only)

```bash
# Sync iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode: Product → Archive → Distribute
```

---

## App Name Reference

- **Display Name**: MobileToolsBox
- **Package ID (Android)**: com.mobiletoolsbox.app
- **Bundle ID (iOS)**: com.mobiletoolsbox.app
- **PM2 Name**: mobiletoolsbox
- **Keystore File**: mobiletoolsbox-release-key.keystore
- **Keystore Alias**: mobiletoolsbox

---

## Quick Troubleshooting

**Build fails?**
```bash
cd android
.\gradlew clean
cd ..
npm run build
.\build-android.ps1
```

**Port 5000 in use?**
```powershell
netstat -ano | findstr :5000
# Note the PID, then:
taskkill /PID <PID> /F
```

**Need to sync Capacitor?**
```bash
npx cap sync
```

---

## Ready to Deploy?

✅ Android: Upload AAB to [Google Play Console](https://play.google.com/console)  
✅ iOS: Submit via Xcode to [App Store Connect](https://appstoreconnect.apple.com)  
✅ Web: Follow `VPS_QUICK_DEPLOY.md` for VPS setup

---

**Good luck with your deployment!** 🎉


