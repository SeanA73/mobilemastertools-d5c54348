# ✅ MobileToolsBox Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

---

## 🎯 Pre-Deployment Checklist

### Development Environment
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] All TypeScript errors resolved (or documented as non-blocking)
- [ ] App builds successfully: `npm run build`
- [ ] Git repository up to date
- [ ] All sensitive data removed from code

### Accounts & Services Setup
- [ ] VPS account created (DigitalOcean/AWS/Linode)
- [ ] Domain name purchased and configured
- [ ] PostgreSQL database provisioned (Neon/Supabase)
- [ ] SendGrid account created (for emails)
- [ ] Stripe account created (for payments)
- [ ] Google Play Console account ($25 fee paid)
- [ ] Apple Developer account ($99/year) - if deploying iOS
- [ ] Google AdSense approved (optional)

### API Keys & Credentials Collected
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Generated random string (32+ chars)
- [ ] `SENDGRID_API_KEY` - SendGrid API key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `VITE_ADSENSE_CLIENT_ID` - AdSense publisher ID (optional)

---

## 🌐 Web Deployment Checklist

### Server Setup
- [ ] VPS provisioned (Ubuntu 22.04 LTS)
- [ ] SSH access configured
- [ ] Non-root user created
- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Certbot installed for SSL
- [ ] Git installed

### Application Deployment
- [ ] Application directory created: `/var/www/mobiletoolsbox`
- [ ] Code uploaded to server (git clone or SCP)
- [ ] `.env.production` file created with all variables
- [ ] Dependencies installed: `npm install --production`
- [ ] Application built: `npm run build`
- [ ] Build verified: `ls -lh dist/`

### Database Configuration
- [ ] Database schema pushed: `npm run db:push`
- [ ] Database connection tested
- [ ] Achievements initialized (optional)
- [ ] Admin user created (if applicable)

### PM2 Configuration
- [ ] Application started: `pm2 start ecosystem.config.js`
- [ ] PM2 config saved: `pm2 save`
- [ ] PM2 startup configured
- [ ] Application running: `pm2 status`
- [ ] Logs checked: `pm2 logs mobiletoolsbox`

### Nginx Configuration
- [ ] Nginx config file created
- [ ] Domain name updated in config
- [ ] Config enabled in sites-enabled
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

### DNS Configuration
- [ ] A record created: @ → SERVER_IP
- [ ] A record created: www → SERVER_IP
- [ ] DNS propagation verified: `dig yourdomain.com`
- [ ] Domain resolves to server IP

### SSL Certificate
- [ ] SSL certificate generated: `sudo certbot --nginx`
- [ ] HTTPS working on domain
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`
- [ ] Certificate expiry monitored

### Security Hardening
- [ ] UFW firewall enabled (ports 22, 80, 443)
- [ ] Fail2Ban installed and configured
- [ ] Root login disabled (optional but recommended)
- [ ] SSH key authentication enabled
- [ ] Server only accessible via SSH keys

### Testing
- [ ] Local connection works: `curl http://localhost:5000`
- [ ] External HTTP works: `curl http://yourdomain.com`
- [ ] External HTTPS works: `curl https://yourdomain.com`
- [ ] Website loads in browser
- [ ] All pages accessible
- [ ] Login/registration works
- [ ] Database operations work
- [ ] Email sending works (test contact form)
- [ ] Payment processing works (test donation)

### Monitoring Setup
- [ ] PM2 log rotation configured
- [ ] Uptime monitoring setup (UptimeRobot)
- [ ] Error tracking setup (Sentry - optional)
- [ ] Database backup script created
- [ ] Backup cron job configured
- [ ] Server monitoring dashboard access

---

## 🤖 Android Deployment Checklist

### Build Preparation
- [ ] Keystore generated: `mobiletoolsbox-release-key.keystore`
- [ ] Keystore backed up in 3+ secure locations
- [ ] Keystore password saved in password manager
- [ ] `android/key.properties` configured
- [ ] App icon finalized (1024x1024)
- [ ] Splash screen finalized

### Build Process
- [ ] Web app built: `npm run build`
- [ ] Android project synced: `npx cap sync android`
- [ ] Gradle clean executed: `cd android && .\gradlew clean`
- [ ] Release AAB built: `.\build-android.ps1`
- [ ] AAB file verified at: `android\app\build\outputs\bundle\release\app-release.aab`
- [ ] AAB size checked (should be < 150MB)

### Google Play Console Setup
- [ ] Developer account created ($25 paid)
- [ ] App created in console
- [ ] App name set: MobileToolsBox
- [ ] Package name: com.mobiletoolsbox.app

### Store Listing Completed
- [ ] Short description written (50 chars)
- [ ] Full description written (4000 chars max)
- [ ] App category selected: Productivity
- [ ] Tags added
- [ ] Contact email: support@mobiletoolsbox.app
- [ ] Website URL added
- [ ] Privacy policy URL added

### Graphics & Assets
- [ ] App icon uploaded (512x512)
- [ ] Feature graphic created (1024x500)
- [ ] Phone screenshots (2-8 images, 1080x2340)
- [ ] 7" tablet screenshots (optional)
- [ ] 10" tablet screenshots (optional)
- [ ] Promo video created (optional)

### App Release
- [ ] Release created in Production track
- [ ] AAB uploaded successfully
- [ ] Release name set: 1.0.0
- [ ] Release notes written
- [ ] Content rating completed
- [ ] Pricing set (Free)
- [ ] Countries selected (or "All countries")

### Pre-Launch
- [ ] All sections have green checkmarks
- [ ] Pre-launch report reviewed
- [ ] Beta testing completed (optional)
- [ ] Submitted for review
- [ ] Review notification email confirmed

### Post-Launch
- [ ] App approved (usually 1-3 days)
- [ ] App live on Google Play
- [ ] App tested by downloading from Play Store
- [ ] Analytics configured (Google Play Console)
- [ ] User reviews monitored

---

## 🍎 iOS Deployment Checklist

### Prerequisites
- [ ] Mac with Xcode installed
- [ ] Apple Developer Program membership active ($99/year)
- [ ] Development certificate installed
- [ ] Distribution certificate installed

### Build Preparation
- [ ] iOS platform added: `npx cap add ios`
- [ ] Web app built: `npm run build`
- [ ] iOS synced: `npx cap sync ios`
- [ ] App icons prepared (1024x1024)
- [ ] Launch screen configured

### Xcode Configuration
- [ ] Project opened in Xcode: `npx cap open ios`
- [ ] Bundle identifier set: com.mobiletoolsbox.app
- [ ] Display name set: MobileToolsBox
- [ ] Version set: 1.0.0
- [ ] Build number set: 1
- [ ] Team selected
- [ ] Automatic signing enabled
- [ ] Capabilities configured

### Build & Archive
- [ ] Device set to "Any iOS Device"
- [ ] Build folder cleaned
- [ ] Archive created successfully
- [ ] Archive validated
- [ ] Archive uploaded to App Store Connect

### App Store Connect
- [ ] App created in App Store Connect
- [ ] App name: MobileToolsBox
- [ ] Subtitle added
- [ ] Primary category: Productivity
- [ ] Secondary category: Utilities
- [ ] Age rating completed

### App Information
- [ ] Description written (4000 chars max)
- [ ] Keywords added (100 chars max)
- [ ] Support URL added
- [ ] Marketing URL added (optional)
- [ ] Privacy policy URL added

### Screenshots & Media
- [ ] 6.5" iPhone screenshots (required)
- [ ] 5.5" iPhone screenshots (optional)
- [ ] iPad Pro screenshots (optional)
- [ ] App preview video (optional, 15-30 sec)

### Pricing & Availability
- [ ] Price set (Free)
- [ ] Countries selected
- [ ] Release date configured

### App Review Information
- [ ] Demo account provided (if login required)
- [ ] Review notes added
- [ ] Contact information provided

### Privacy
- [ ] Privacy practices questionnaire completed
- [ ] Data collection practices declared
- [ ] Privacy policy link verified

### Submission
- [ ] All sections complete
- [ ] Build selected
- [ ] Export compliance answered
- [ ] Advertising identifier answered
- [ ] Submitted for review
- [ ] Confirmation email received

### Post-Launch
- [ ] App approved (usually 1-2 days)
- [ ] App live on App Store
- [ ] App tested by downloading from App Store
- [ ] Analytics configured (App Store Connect)
- [ ] User reviews monitored

---

## 📱 Multi-Platform Testing Checklist

### Web (Desktop)
- [ ] Chrome - Latest version
- [ ] Firefox - Latest version
- [ ] Safari - Latest version
- [ ] Edge - Latest version

### Web (Mobile)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet (Android)

### Android App
- [ ] Tested on Android 8.0+
- [ ] Tested on phone (small screen)
- [ ] Tested on tablet (large screen)
- [ ] Portrait and landscape modes
- [ ] Different screen resolutions

### iOS App
- [ ] Tested on iOS 13.0+
- [ ] Tested on iPhone (small screen)
- [ ] Tested on iPad (large screen)
- [ ] Portrait and landscape modes
- [ ] Dark mode compatibility

---

## 🔍 Feature Testing Checklist

### Authentication & Users
- [ ] User registration works
- [ ] Email verification works (if enabled)
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works
- [ ] User profile updates
- [ ] Session persistence

### Core Features
- [ ] All 20+ tools accessible
- [ ] Data saves correctly
- [ ] Data loads correctly
- [ ] Offline mode works (where applicable)
- [ ] Cloud sync works
- [ ] Search functionality works

### Productivity Tools
- [ ] Notes - Create, edit, delete
- [ ] Todo Manager - Add, complete, delete tasks
- [ ] Pomodoro Timer - Start, pause, complete
- [ ] Project Timer - Track time accurately
- [ ] Flashcards - Create, study, review

### Utility Tools
- [ ] Calculator - All operations work
- [ ] Unit Converter - Conversions accurate
- [ ] File Converter - Converts files correctly
- [ ] QR Scanner - Scans and generates codes
- [ ] Password Generator - Creates secure passwords

### Advanced Features
- [ ] Habit Tracker - Streaks calculate correctly
- [ ] Voice Recorder - Records and plays back
- [ ] IQ Tester - Questions and scoring work
- [ ] Achievements - Unlock correctly
- [ ] Settings - All options save

### Payment & Subscriptions
- [ ] Donation flow works
- [ ] Payment processing succeeds
- [ ] Stripe webhooks work
- [ ] Subscription upgrades work
- [ ] Subscription downgrades work

### Notifications
- [ ] Email notifications send
- [ ] Push notifications work (mobile)
- [ ] Notification preferences save

### Performance
- [ ] Page load time < 3 seconds
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] No lag on interactions
- [ ] File uploads work quickly

### SEO & Analytics
- [ ] Meta tags set correctly
- [ ] Open Graph tags configured
- [ ] Twitter Card tags configured
- [ ] Google Analytics tracking (optional)
- [ ] Sitemap generated
- [ ] Robots.txt configured

---

## 📊 Post-Deployment Monitoring

### Daily Checks (First Week)
- [ ] Check PM2 status: `pm2 status`
- [ ] Review error logs: `pm2 logs mobiletoolsbox --err`
- [ ] Check server resources: `htop`
- [ ] Monitor uptime alerts
- [ ] Review user feedback
- [ ] Check app store reviews
- [ ] Monitor crash reports

### Weekly Checks
- [ ] Database backup verification
- [ ] SSL certificate status
- [ ] Server updates: `sudo apt update && sudo apt upgrade`
- [ ] Security audit
- [ ] Performance metrics review
- [ ] User analytics review

### Monthly Checks
- [ ] Review server costs
- [ ] Optimize database queries
- [ ] Review and rotate logs
- [ ] Update dependencies
- [ ] Security patches applied
- [ ] Backup restoration test

---

## 🚨 Emergency Procedures

### Website Down
1. Check PM2: `pm2 status`
2. Check Nginx: `sudo systemctl status nginx`
3. Check logs: `pm2 logs mobiletoolsbox --err`
4. Restart if needed: `pm2 restart mobiletoolsbox`
5. Check DNS resolution
6. Verify SSL certificate

### Database Issues
1. Check database connection
2. Review database logs
3. Check disk space
4. Restore from backup if needed
5. Contact database provider support

### Security Breach
1. Take site offline immediately
2. Change all passwords and API keys
3. Review access logs
4. Restore from clean backup
5. Apply security patches
6. Notify affected users (if required by law)

### High Traffic / DDoS
1. Enable Cloudflare (if not already)
2. Increase server resources
3. Enable rate limiting
4. Check for attack patterns
5. Block malicious IPs

---

## 📝 Important Contacts & Resources

### Service Providers
- **VPS Support**: Your provider's support email/phone
- **Domain Registrar**: Support contact
- **Database Provider**: Support email
- **SendGrid Support**: https://support.sendgrid.com
- **Stripe Support**: https://support.stripe.com

### Developer Resources
- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Google Play Help**: https://support.google.com/googleplay/android-developer
- **App Store Connect**: https://developer.apple.com/support
- **Capacitor Docs**: https://capacitorjs.com/docs

### Internal Resources
- **Full Deployment Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **VPS Quick Deploy**: `VPS_QUICK_DEPLOY.md`
- **Android Guide**: `ANDROID_DEPLOYMENT_GUIDE.md`
- **iOS Guide**: `IOS_DEPLOYMENT_GUIDE.md`
- **Quick Build Guide**: `QUICK_BUILD_GUIDE.md`

---

## ✅ Final Sign-Off

Before declaring deployment complete:

- [ ] All critical features tested and working
- [ ] All checklist items completed
- [ ] Monitoring and alerts configured
- [ ] Backups scheduled and tested
- [ ] Team trained on emergency procedures
- [ ] Documentation updated
- [ ] Launch announcement prepared
- [ ] Support channels ready

---

## 🎉 Deployment Complete!

**Date Deployed**: _______________

**Deployed By**: _______________

**Production URLs**:
- Website: https://_______________
- Android: https://play.google.com/store/apps/details?id=com.mobiletoolsbox.app
- iOS: https://apps.apple.com/app/mobiletoolsbox/id_______________

**Next Steps**:
1. Monitor for first 48 hours closely
2. Respond to user feedback promptly
3. Plan first update/improvements
4. Market and promote the app

---

**Congratulations on successfully deploying MobileToolsBox!** 🚀


