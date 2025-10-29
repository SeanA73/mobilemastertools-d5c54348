# 🚀 MobileToolsBox Deployment Checklist

Use this checklist to track your deployment progress across all platforms.

## ✅ Pre-Deployment (Phase 1)

### Environment Setup
- [ ] Copy `env.production.template` to `.env.production`
- [ ] Fill in all required environment variables in `.env.production`
- [ ] Generate strong `SESSION_SECRET` using `openssl rand -base64 32`
- [ ] Obtain SendGrid API key and add to `.env.production`
- [ ] Obtain Stripe API keys and add to `.env.production`
- [ ] Obtain Google AdSense Client ID and add to `.env.production`
- [ ] Verify `.env.production` is in `.gitignore`

### Code Preparation
- [ ] Remove Replit plugins from `vite.config.ts` ✅ (Done)
- [ ] Update Android signing in `build.gradle` ✅ (Done)
- [ ] Test production build: `npm run build`
- [ ] Verify no linting errors: `npm run check`
- [ ] Run all tests (if applicable)

### Database Setup
- [ ] Provision PostgreSQL database (DigitalOcean/AWS RDS)
- [ ] Update `DATABASE_URL` in `.env.production`
- [ ] Run database migrations: `npm run db:push`
- [ ] Initialize admin user
- [ ] Test database connection

## 🌐 Web Deployment (Phase 2)

### VPS Setup
- [ ] Provision VPS (Ubuntu 22.04 LTS, 2GB+ RAM)
- [ ] Record VPS IP address
- [ ] SSH access configured
- [ ] Update system: `apt update && apt upgrade -y`

### Software Installation
- [ ] Install Node.js 20.x
- [ ] Install PM2 globally: `npm install -g pm2`
- [ ] Install Nginx
- [ ] Install Certbot

### Application Deployment
- [ ] Create directory: `/var/www/mobiletoolsbox`
- [ ] Clone/upload code to server
- [ ] Copy `.env.production` to server
- [ ] Install dependencies: `npm install --production`
- [ ] Build application: `npm run build`
- [ ] Test build locally

### Server Configuration
- [ ] Configure Nginx reverse proxy
- [ ] Enable Nginx site
- [ ] Test Nginx config: `nginx -t`
- [ ] Reload Nginx
- [ ] Start app with PM2: `pm2 start ecosystem.config.js`
- [ ] Save PM2 config: `pm2 save`
- [ ] Enable PM2 startup: `pm2 startup`

### Domain & SSL
- [ ] Point domain A record to VPS IP
- [ ] Wait for DNS propagation (check with `dig yourdomain.com`)
- [ ] Generate SSL certificate: `certbot --nginx -d yourdomain.com`
- [ ] Verify SSL auto-renewal: `certbot renew --dry-run`
- [ ] Test HTTPS access

### Testing
- [ ] Visit `https://yourdomain.com` in browser
- [ ] Test user registration/login
- [ ] Test all major tools functionality
- [ ] Check API endpoints with mobile app
- [ ] Verify CORS configuration for mobile origins

## 📱 iOS Deployment (Phase 3)

### Preparation
- [ ] Verify `capacitor.config.ts` has correct `appId`
- [ ] Update version in `package.json` to `1.0.0`
- [ ] Prepare 1024x1024 app icon in `resources/icon.png`
- [ ] Prepare splash screen in `resources/splash.png`

### Build
- [ ] Generate app icons: `npx @capacitor/assets generate`
- [ ] Build web app: `npm run build`
- [ ] Sync with iOS: `npx cap sync ios`
- [ ] Open Xcode: `npx cap open ios`

### Xcode Configuration
- [ ] Set Bundle ID: `com.mobiletoolsbox.app`
- [ ] Set Display Name: `MobileToolsBox`
- [ ] Set Version: `1.0.0`
- [ ] Set Build: `1`
- [ ] Select Apple Developer Team
- [ ] Enable "Automatically manage signing"
- [ ] Verify provisioning profile created
- [ ] Set Deployment Target: iOS 13.0+

### App Capabilities
- [ ] Add Background Modes capability (if needed)
- [ ] Add Push Notifications capability (if needed)
- [ ] Verify all permissions are configured

### Archive & Upload
- [ ] Select "Any iOS Device" as target
- [ ] Product → Archive
- [ ] Wait for archive to complete (5-15 mins)
- [ ] Click "Distribute App"
- [ ] Select "App Store Connect"
- [ ] Upload build
- [ ] Wait for processing (30 mins - 2 hours)

### App Store Connect
- [ ] Create new app at appstoreconnect.apple.com
- [ ] Fill in app information
- [ ] Set category: Productivity
- [ ] Add privacy policy URL
- [ ] Create app description (see Planning-Dir/MOBILE_DEPLOYMENT_GUIDE.md)
- [ ] Add keywords
- [ ] Upload 6.7" iPhone screenshots (min 3)
- [ ] Upload iPad screenshots (optional)
- [ ] Select build version
- [ ] Add release notes
- [ ] Submit for review
- [ ] Monitor review status

## 🤖 Android Deployment (Phase 4)

### Signing Key Generation
- [ ] Generate keystore: `keytool -genkey -v -keystore mobiletoolsbox-release-key.keystore ...`
- [ ] **BACKUP keystore file and password securely!** (Critical!)
- [ ] Copy `android/key.properties.template` to `android/key.properties`
- [ ] Fill in keystore details in `android/key.properties`
- [ ] Verify `key.properties` is in `.gitignore`

### Build
- [ ] Build web app: `npm run build`
- [ ] Sync with Android: `npx cap sync android`
- [ ] Navigate to android directory: `cd android`
- [ ] Build release AAB: `./gradlew bundleRelease`
- [ ] Verify AAB created at: `app/build/outputs/bundle/release/app-release.aab`

### Google Play Console
- [ ] Create new app at play.google.com/console
- [ ] Set app name: MobileToolsBox
- [ ] Set default language: English (United States)
- [ ] Select "App"
- [ ] Select "Free"

### Store Listing
- [ ] Add short description (80 chars)
- [ ] Add full description (see Planning-Dir/MOBILE_DEPLOYMENT_GUIDE.md)
- [ ] Upload 512x512 app icon
- [ ] Create and upload 1024x500 feature graphic
- [ ] Upload phone screenshots (min 2, max 8)
- [ ] Upload tablet screenshots (optional)
- [ ] Set app category: Productivity
- [ ] Add contact details
- [ ] Add privacy policy URL

### Content Rating
- [ ] Complete content rating questionnaire
- [ ] Verify rating: Everyone or PEGI 3

### Data Safety
- [ ] Complete data safety form
- [ ] Specify data collection practices
- [ ] Add data encryption statement

### Release
- [ ] Go to Production → Create new release
- [ ] Upload `app-release.aab`
- [ ] Add release name: v1.0.0
- [ ] Add release notes
- [ ] Review all information
- [ ] Submit for review
- [ ] Monitor review status (1-3 days)

## 📊 Post-Deployment (Phase 5 & 6)

### Monitoring Setup
- [ ] Install PM2 log rotate: `pm2 install pm2-logrotate`
- [ ] Set up UptimeRobot or Pingdom
- [ ] Configure error tracking (Sentry)
- [ ] Set up Google Analytics (optional)
- [ ] Configure email alerts for downtime

### Database Management
- [ ] Configure automated daily backups
- [ ] Test backup restoration process
- [ ] Set backup retention policy (30 days)
- [ ] Document backup/restore procedures

### Security Hardening
- [ ] Configure firewall: `ufw allow 22,80,443/tcp && ufw enable`
- [ ] Disable root SSH login
- [ ] Install fail2ban: `apt install fail2ban`
- [ ] Configure rate limiting on API
- [ ] Review and update security headers
- [ ] Scan for vulnerabilities

### Testing & Verification
- [ ] Test web app on desktop browsers
- [ ] Test web app on mobile browsers
- [ ] Test iOS app on physical device
- [ ] Test Android app on physical device
- [ ] Verify data synchronization across platforms
- [ ] Test all payment/donation flows
- [ ] Verify email notifications work
- [ ] Test AdSense ads display correctly

### Launch Preparation
- [ ] Prepare launch announcement
- [ ] Create social media posts
- [ ] Prepare Product Hunt submission
- [ ] Set up support email
- [ ] Create FAQ document
- [ ] Prepare press kit
- [ ] Create demo video (optional)

### Go Live!
- [ ] iOS app approved and live ✨
- [ ] Android app approved and live ✨
- [ ] Web app accessible at domain ✨
- [ ] All platforms tested and working ✨
- [ ] Announce launch on social media 📣
- [ ] Submit to Product Hunt 🚀
- [ ] Monitor for issues in first 48 hours 👀
- [ ] Respond to user feedback promptly 💬

## 🔄 Ongoing Maintenance

### Regular Tasks
- [ ] Monitor server performance daily
- [ ] Review error logs weekly
- [ ] Check database backups weekly
- [ ] Respond to app store reviews
- [ ] Update dependencies monthly
- [ ] Review and optimize costs monthly

### Updates & Improvements
- [ ] Plan feature roadmap
- [ ] Implement user feedback
- [ ] Fix bugs reported by users
- [ ] Release regular updates (monthly)
- [ ] Keep app stores listings updated

## 📝 Important Notes

1. **Android Keystore**: The keystore file is IRREPLACEABLE. Without it, you cannot update your app. Store it securely with passwords in a password manager!

2. **Environment Variables**: Never commit `.env.production` or any file with production secrets to version control.

3. **Database Backups**: Always test backup restoration before you need it in production.

4. **Monitoring**: Set up monitoring on day 1. Don't wait until something breaks.

5. **Documentation**: Keep this checklist updated as you discover new steps or issues.

## 🆘 Need Help?

- Review detailed guides in `Planning-Dir/`
- Check `DEPLOYMENT_INSTRUCTIONS.md`
- Review `multi-platform-deployment-plan.plan.md`
- Test in development environment first
- Keep backups of all configuration files

---

**Good luck with your deployment! 🎉**

