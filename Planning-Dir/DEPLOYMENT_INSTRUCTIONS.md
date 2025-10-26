# MobileToolsBox Deployment Instructions

This document contains step-by-step instructions for deploying MobileToolsBox to production.

## Prerequisites

Before starting deployment, ensure you have:

- [ ] Apple Developer Account ($99/year) - for iOS
- [ ] Google Play Developer Account ($25 one-time) - for Android
- [ ] VPS Server (DigitalOcean/AWS) - for web backend
- [ ] PostgreSQL Database - for production data
- [ ] Domain name registered and configured
- [ ] SendGrid account (for email notifications)
- [ ] Stripe account (for donations/payments)
- [ ] Google AdSense account (for ad revenue)

## Phase 1: Environment Configuration

### 1.1 Create Production Environment File

```bash
# Copy the template
cp env.production.template .env.production

# Edit with your actual values
nano .env.production
```

Fill in all required values:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - Generate with: `openssl rand -base64 32`
- `SENDGRID_API_KEY` - From SendGrid dashboard
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `VITE_ADSENSE_CLIENT_ID` - From Google AdSense

### 1.2 Database Setup

```bash
# Run database migrations
npm run db:push

# Initialize database (if needed)
npm run init-db
```

## Phase 2: Web Deployment

### 2.1 Build for Production

```bash
# Install dependencies
npm install --production

# Build the application
npm run build
```

### 2.2 Deploy to VPS

See `Planning-Dir/MOBILE_DEPLOYMENT_GUIDE.md` for detailed VPS setup instructions.

Key steps:
1. Provision Ubuntu 22.04 LTS server (2GB+ RAM)
2. Install Node.js 20.x, PM2, Nginx, and Certbot
3. Clone repository to `/var/www/mobiletoolsbox`
4. Configure environment variables
5. Set up Nginx reverse proxy
6. Configure SSL with Let's Encrypt
7. Start with PM2: `pm2 start ecosystem.config.js`

## Phase 3: Mobile App Deployment

### 3.1 iOS Deployment

```bash
# Generate app icons and splash screens
npx @capacitor/assets generate

# Build web app
npm run build

# Sync with iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Set Bundle ID: `com.mobiletoolsbox.app`
2. Set Version: `1.0.0`
3. Configure signing with your Apple Developer account
4. Archive: Product → Archive
5. Distribute to App Store Connect
6. Submit for review

### 3.2 Android Deployment

```bash
# Generate signing key (SAVE SECURELY!)
keytool -genkey -v -keystore mobiletoolsbox-release-key.keystore \
  -alias mobiletoolsbox -keyalg RSA -keysize 2048 -validity 10000

# Create key.properties in android/ directory
cat > android/key.properties << EOF
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=mobiletoolsbox
storeFile=../../mobiletoolsbox-release-key.keystore
EOF

# Build release AAB
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` to Google Play Console.

## Phase 4: Post-Deployment

### 4.1 Monitor Application

```bash
# View PM2 logs
pm2 logs mobiletoolsbox

# Monitor status
pm2 monit

# Check server status
pm2 status
```

### 4.2 Set Up Monitoring

- Configure PM2 monitoring: `pm2 install pm2-logrotate`
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry)

### 4.3 Database Backups

Configure automated daily backups of your PostgreSQL database.

## Troubleshooting

### Build Errors

```bash
# Clear caches
rm -rf node_modules dist
npm install
npm run build
```

### PM2 Issues

```bash
# Restart application
pm2 restart mobiletoolsbox

# View detailed logs
pm2 logs mobiletoolsbox --lines 100
```

### Database Connection Issues

- Check `DATABASE_URL` in `.env.production`
- Verify PostgreSQL is running and accessible
- Check firewall rules allow database connections

## Security Checklist

- [ ] Strong SESSION_SECRET generated
- [ ] All API keys in .env.production (not in code)
- [ ] .env.production NOT committed to git
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] fail2ban installed and configured
- [ ] SSL certificate installed and auto-renewal enabled
- [ ] Android keystore backed up securely
- [ ] Rate limiting enabled on API endpoints

## Support

For detailed deployment guides, see:
- `Planning-Dir/MOBILE_DEPLOYMENT_GUIDE.md`
- `Planning-Dir/ADSENSE_INTEGRATION_GUIDE.md`
- `multi-platform-deployment-plan.plan.md`

