# 🐧 Ubuntu 24.04 LTS Deployment Guide

Complete step-by-step guide to deploy MobileToolsBox on Ubuntu 24.04 LTS.

---

## 📋 Prerequisites

- Ubuntu 24.04 LTS server
- SSH access (root or sudo user)
- Domain name (optional, but recommended)
- 5-10 minutes of setup time

---

## 🚀 Quick Deploy (Automated)

### Step 1: Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
# or
ssh your-username@YOUR_SERVER_IP
```

### Step 2: Update System

```bash
# Update package list
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git nano ufw
```

### Step 3: Install Node.js 20.x

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
```

### Step 4: Install PM2 (Process Manager)

```bash
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u YOUR_USERNAME --hp /home/YOUR_USERNAME
```

### Step 5: Install Nginx

```bash
apt install -y nginx

# Enable Nginx to start on boot
systemctl enable nginx
systemctl start nginx
```

### Step 6: Install Certbot (for SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

### Step 7: Setup Firewall

```bash
# Allow SSH, HTTP, and HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 📦 Deploy Your App

### Step 1: Create App Directory

```bash
# Create directory
mkdir -p /var/www/mobiletoolsbox
cd /var/www/mobiletoolsbox
```

### Step 2: Upload Your Code

**Option A: Git Clone (Recommended)**

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# Or if you need to specify a branch:
git clone -b main https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .
```

**Option B: Upload via SCP (from your local machine)**

On your Windows machine:
```powershell
# From your project directory
scp -r . root@YOUR_SERVER_IP:/var/www/mobiletoolsbox/
```

### Step 3: Install Dependencies

```bash
cd /var/www/mobiletoolsbox
npm install
```

### Step 4: Configure Environment Variables

```bash
# Create production environment file
cp env.production.template .env.production

# Edit the file
nano .env.production
```

**Required variables:**

```env
# Database (use Neon free tier or your own PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-secret-here

# SendGrid for emails (optional)
SENDGRID_API_KEY=your-sendgrid-key

# Stripe for payments (optional)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# Domain
DOMAIN=https://yourdomain.com
```

**Save with:** `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Build the App

```bash
# Build production version
npm run build
```

### Step 6: Setup PostgreSQL Database

**If you're using Neon (recommended):**

1. Get your connection string from Neon dashboard
2. Add it to `.env.production`:
   ```bash
   nano .env.production
   ```
   
   Set your DATABASE_URL:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. Run database migrations:
   ```bash
   npm run db:push
   ```
   
   This creates all tables in your database.

**Troubleshooting:**
- If "connection refused": Check Neon dashboard → Settings → Allowed IPs → Add your VPS IP
- If "SSL required": Ensure connection string has `?sslmode=require`
- Test connection: `node -e "import('pg').then(pg => { const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()', (err, res) => { if (err) console.error('Error:', err); else console.log('Success:', res.rows[0]); pool.end(); }); });"`

---

## 🔧 Configure PM2

### Step 1: Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

**Content should already exist, but if not:**

```javascript
export default {
  apps: [{
    name: 'mobiletoolsbox',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env_file: './.env.production',  // Load environment variables from file
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

**Important:** The `env_file: './.env.production'` line tells PM2 to load your DATABASE_URL and other environment variables from the `.env.production` file.

### Step 2: Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# View logs
pm2 logs mobiletoolsbox
```

---

## 🌐 Configure Nginx

### Step 1: Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/mobiletoolsbox
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Replace `yourdomain.com` with your actual domain.**

### Step 2: Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/mobiletoolsbox /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

---

## 🔒 Setup SSL with Let's Encrypt

### Step 1: Setup SSL

```bash
# Make sure DNS points to your server first!
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 2: Auto-renewal

Certbot automatically sets up auto-renewal. Test it:

```bash
certbot renew --dry-run
```

---

## 🧪 Test Your Deployment

### Step 1: Check Website

```bash
# From your browser, visit:
https://yourdomain.com
```

### Step 2: Check Logs

```bash
# PM2 logs
pm2 logs mobiletoolsbox

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Step 3: Check Services

```bash
# Check PM2
pm2 status

# Check Nginx
systemctl status nginx

# Check firewall
ufw status
```

---

## 🔄 Updating Your App

When you want to deploy updates:

```bash
cd /var/www/mobiletoolsbox

# Pull latest changes
git pull origin main
# Or upload new files via SCP

# Install new dependencies (if package.json changed)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart mobiletoolsbox

# Check logs
pm2 logs mobiletoolsbox
```

---

## 🛠️ Common Commands

### PM2 Commands

```bash
# View all apps
pm2 list

# View logs
pm2 logs mobiletoolsbox

# Restart app
pm2 restart mobiletoolsbox

# Stop app
pm2 stop mobiletoolsbox

# Start app
pm2 start mobiletoolsbox

# View real-time logs
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Restart Nginx
systemctl restart nginx

# View status
systemctl status nginx
```

### System Commands

```bash
# Update system
apt update && apt upgrade -y

# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop
```

---

## 🐛 Troubleshooting

### Website Shows 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart mobiletoolsbox

# Check logs
pm2 logs mobiletoolsbox

# Restart Nginx
systemctl restart nginx
```

### Website Shows Connection Refused

```bash
# Check if app is listening on port 5000
ss -tlnp | grep 5000

# Check PM2
pm2 logs mobiletoolsbox
```

### SSL Certificate Issues

```bash
# Renew certificate manually
certbot renew

# Check certificate status
certbot certificates
```

### Database Connection Errors

```bash
# Check DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL

# Test database connection
node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1')"
```

**If you see "DATABASE_URL not set" warnings:**

1. Verify `.env.production` exists and contains DATABASE_URL
2. Make sure PM2 is loading the env file - check `ecosystem.config.js` has `env_file: './.env.production'`
3. Restart PM2 to reload environment:
   ```bash
   pm2 restart mobiletoolsbox
   pm2 logs mobiletoolsbox
   ```

**If "Connection refused" or "Connection timeout":**

1. Check Neon dashboard → Settings → Allowed IPs
2. Add your VPS IP address to the allowlist (or use "Allow all IPs" for testing)
3. Wait 2-3 minutes for IP changes to take effect

**If "SSL required":**

Ensure your connection string includes `?sslmode=require` at the end:
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

**If data isn't persisting:**

1. Verify migrations ran: `npm run db:push`
2. Check PM2 is loading env variables: `pm2 logs mobiletoolsbox | grep DATABASE_URL`
3. Restart the app: `pm2 restart mobiletoolsbox`

---

## 🔐 Security Best Practices

### Step 1: Disable Root Login

```bash
# Create a new user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Configure SSH key
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
# Paste your public key
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Disable root login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Restart SSH
systemctl restart sshd
```

### Step 2: Setup Fail2Ban

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### Step 3: Regular Backups

```bash
# Create backup script
nano /root/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /root/backups/mobiletoolsbox_$DATE.tar.gz /var/www/mobiletoolsbox
# Keep only last 7 days
find /root/backups -name "mobiletoolsbox_*.tar.gz" -mtime +7 -delete
```

```bash
chmod +x /root/backup.sh

# Setup cron job (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup.sh
```

---

## 📊 Monitoring

### Setup Monitoring (Optional)

```bash
# Install monitoring
npm install -g pm2-server-monit
pm2 install pm2-server-monit

# Access dashboard at your-domain.com:9615
# But block it in firewall!
```

---

## ✅ Deployment Checklist

- [ ] Ubuntu 24.04 LTS installed
- [ ] Node.js 20.x installed
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] App built and running
- [ ] Database connected
- [ ] Environment variables set
- [ ] Auto-renewal for SSL configured
- [ ] Backups configured
- [ ] Monitoring setup (optional)

---

## 🎉 Success!

Your app should now be live at:
**https://yourdomain.com**

---

## 📞 Need Help?

- Check logs: `pm2 logs mobiletoolsbox`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Restart services: `pm2 restart mobiletoolsbox && systemctl restart nginx`

---

**Your app is now deployed on Ubuntu 24.04 LTS!** 🚀

