# Multiple Websites on One Ubuntu VPS

Complete guide for hosting multiple websites on a single Ubuntu 24.04 VPS.

---

## Overview

You can host many websites on one VPS by:
- Running each site on a different port
- Using Nginx as a reverse proxy to route domains to the correct port
- Managing all sites with PM2

---

## Architecture

```
Internet
   ↓
Nginx (Port 80/443)
   ↓         ↓
Port 5000  Port 5001  Port 5002
Site A     Site B      Site C
```

Each website:
- Runs on its own port (5000, 5001, 5002, etc.)
- Has its own directory (`/var/www/site1`, `/var/www/site2`, etc.)
- Has its own PM2 process
- Has its own Nginx configuration

---

## Setting Up Your First Website

If you haven't done this yet, follow the main `UBUNTU_DEPLOYMENT_GUIDE.md`.

For this guide, we'll assume:
- Site 1: `mobiletoolsbox.com` (Port 5000)
- Site 2: `newsite.com` (Port 5001)

---

## Adding a Second Website

### Step 1: Prepare Your Code Locally

```bash
# On your local machine, in your new project
npm run build
```

Make sure your code is built and ready.

### Step 2: Upload to VPS

**Option A: Git Clone (Recommended)**

```bash
# SSH to your VPS
ssh root@YOUR_SERVER_IP

# Create directory for new site
mkdir -p /var/www/newsite
cd /var/www/newsite

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Or if you need to specify a branch
git clone -b main https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

**Option B: SCP Upload**

On your local machine:
```powershell
scp -r . root@YOUR_SERVER_IP:/var/www/newsite/
```

### Step 3: Install Dependencies

```bash
cd /var/www/newsite
npm install
```

### Step 4: Configure Environment Variables

```bash
# Create .env.production file
cp env.production.template .env.production
nano .env.production
```

**Important:** Set a different port:

```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
NODE_ENV=production
PORT=5001
SESSION_SECRET=another-secret-here
```

**Note:** Port 5001 (different from your first site!)

### Step 5: Build the App

```bash
npm run build
```

### Step 6: Setup Database (if needed)

```bash
npm run db:push
```

### Step 7: Create PM2 Configuration

```bash
cd /var/www/newsite
nano ecosystem.config.js
```

Create or update the file:

```javascript
module.exports = {
  apps: [{
    name: 'newsite',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env_file: './.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: 5001  // Different port!
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
};
```

### Step 8: Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 list
```

You should see both apps running:
```
┌────────┬──────────┬─────────┐
│ name   │ status   │ port   │
├────────┼──────────┼─────────┤
│ mobiletoolsbox │ online   │ 5000   │
│ newsite         │ online   │ 5001   │
└────────┴──────────┴─────────┘
```

---

## Configure Nginx for Second Website

### Step 1: Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/newsite
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name newsite.com www.newsite.com;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Proxy to Node.js app on port 5001
    location / {
        proxy_pass http://localhost:5001;
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

### Step 2: Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/newsite /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 3: Setup SSL

```bash
certbot --nginx -d newsite.com -d www.newsite.com
```

Repeat this process for each additional website, using a new port each time.

---

## Managing Multiple Websites

### View All Running Sites

```bash
pm2 list
```

### Restart Specific Site

```bash
pm2 restart newsite
pm2 restart mobiletoolsbox
```

### Restart All Sites

```bash
pm2 restart all
```

### View Logs for Specific Site

```bash
pm2 logs newsite
pm2 logs mobiletoolsbox
```

### Stop Specific Site

```bash
pm2 stop newsite
```

### Remove Site from PM2

```bash
pm2 delete newsite
```

### Monitor All Sites

```bash
pm2 monit
```

---

## Port Management

Keep track of which port each site uses:

| Site | Port | Directory | Domain |
|------|------|-----------|--------|
| mobiletoolsbox | 5000 | /var/www/mobiletoolsbox | mobiletoolsbox.com |
| newsite | 5001 | /var/www/newsite | newsite.com |
| anothersite | 5002 | /var/www/anothersite | anothersite.com |

**Important:** Each site must use a unique port!

---

## Nginx Directory Structure

```
/etc/nginx/
├── sites-available/    (all configurations)
│   ├── mobiletoolsbox
│   ├── newsite
│   └── anothersite
│
└── sites-enabled/      (active configurations)
    ├── mobiletoolsbox → /sites-available/mobiletoolsbox
    ├── newsite → /sites-available/newsite
    └── anothersite → /sites-available/anothersite
```

---

## Adding a Third Website

Follow the same process with port 5002:

```bash
# 1. Create directory
mkdir -p /var/www/site3

# 2. Upload code
cd /var/www/site3
git clone YOUR_REPO .

# 3. Configure .env.production with PORT=5002

# 4. Build
npm install && npm run build

# 5. Start with PM2
pm2 start ecosystem.config.js --name site3

# 6. Create Nginx config for site3.com

# 7. Setup SSL
certbot --nginx -d site3.com -d www.site3.com
```

---

## Updating Multiple Websites

### Update a Specific Site

```bash
cd /var/www/newsite
git pull
npm install
npm run build
pm2 restart newsite
```

### Update All Sites

Create a script:

```bash
# Create update script
nano /usr/local/bin/update-all-sites
```

```bash
#!/bin/bash

# List of all site directories
SITES=(
  "/var/www/mobiletoolsbox"
  "/var/www/newsite"
  "/var/www/site3"
)

for site in "${SITES[@]}"; do
  if [ -d "$site" ]; then
    echo "Updating $site..."
    cd "$site"
    git pull
    npm install
    npm run build
    pm2 restart "$(basename $site)"
    echo "$site updated successfully!"
  fi
done

pm2 save
echo "All sites updated!"
```

```bash
chmod +x /usr/local/bin/update-all-sites
```

Run with:
```bash
update-all-sites
```

---

## Resource Management

### Check Memory Usage

```bash
pm2 status
pm2 monit  # Real-time monitoring
```

### Limit Memory Per Site

In `ecosystem.config.js`:

```javascript
max_memory_restart: '500M',  // Restart if over 500MB
```

### View Disk Usage

```bash
du -sh /var/www/*
df -h
```

---

## Security Best Practices

### 1. Use Different Users (Optional)

Create separate users for each site:

```bash
# Create user for site 2
adduser site2user
usermod -aG www-data site2user

# Change ownership
chown -R site2user:www-data /var/www/newsite
```

### 2. Firewall Configuration

```bash
# Only open ports you need
ufw status

# HTTP and HTTPS are already open
# SSH is already open
# Individual ports (5000, 5001, etc.) don't need to be exposed
```

### 3. Log Rotation

Setup log rotation to prevent disk from filling up:

```bash
nano /etc/logrotate.d/pm2
```

```bash
/var/www/*/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Backup Strategy

### Backup All Websites

Create backup script:

```bash
nano /usr/local/bin/backup-sites
```

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

mkdir -p "$BACKUP_DIR"

SITES=(
  "/var/www/mobiletoolsbox"
  "/var/www/newsite"
  "/var/www/site3"
)

for site in "${SITES[@]}"; do
  if [ -d "$site" ]; then
    SITE_NAME=$(basename "$site")
    tar -czf "$BACKUP_DIR/${SITE_NAME}_${DATE}.tar.gz" "$site"
    echo "Backed up $SITE_NAME"
  fi
done

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed!"
```

```bash
chmod +x /usr/local/bin/backup-sites
```

Schedule daily backups:

```bash
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /usr/local/bin/backup-sites
```

---

## Troubleshooting

### Site Not Loading

```bash
# Check if app is running
pm2 list

# Check logs
pm2 logs newsite

# Check Nginx
nginx -t
systemctl status nginx

# Check if port is in use
ss -tlnp | grep 5001
```

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :5001

# Kill the process if needed
pm2 delete newsite
pm2 restart newsite
```

### SSL Certificate Issues

```bash
# Renew all certificates
certbot renew

# Or renew specific domain
certbot renew --cert-name newsite.com
```

### Performance Issues

```bash
# Check resource usage
top
htop
pm2 monit

# Check disk space
df -h

# Check memory
free -h
```

---

## Quick Reference Commands

### PM2 Management

```bash
pm2 list                    # Show all apps
pm2 restart newsite        # Restart specific app
pm2 logs newsite          # View logs
pm2 monit                 # Monitor all apps
pm2 stop all              # Stop all apps
pm2 start all             # Start all apps
pm2 delete newsite        # Remove app
pm2 save                  # Save current state
```

### Nginx Management

```bash
nginx -t                          # Test config
systemctl reload nginx           # Reload Nginx
systemctl restart nginx          # Restart Nginx
systemctl status nginx           # Check status
tail -f /var/log/nginx/error.log # View errors
```

### File Management

```bash
cd /var/www/newsite              # Navigate to site
nano .env.production            # Edit config
pm2 restart newsite             # Restart site
```

---

## Example Setup

Here's a complete example of setting up 3 websites:

```
┌──────────────────────┬────────┬─────────────────────────────────┐
│ Domain               │ Port   │ Directory                       │
├──────────────────────┼────────┼─────────────────────────────────┤
│ mobiletoolsbox.com   │ 5000   │ /var/www/mobiletoolsbox        │
│ newsite.com          │ 5001   │ /var/www/newsite                │
│ blog.example.com     │ 5002   │ /var/www/blog                   │
└──────────────────────┴────────┴─────────────────────────────────┘
```

Each site:
- Has its own directory under `/var/www/`
- Runs on a unique port
- Has its own `.env.production` file
- Has its own Nginx configuration
- Is managed by PM2

---

## Summary

To add a new website:

1. ✅ Upload code to `/var/www/newsite/`
2. ✅ Configure `.env.production` with unique PORT
3. ✅ Build with `npm run build`
4. ✅ Start with PM2: `pm2 start ecosystem.config.js --name newsite`
5. ✅ Create Nginx config: `/etc/nginx/sites-available/newsite`
6. ✅ Enable site: `ln -s /etc/nginx/sites-available/newsite /etc/nginx/sites-enabled/`
7. ✅ Reload Nginx: `systemctl reload nginx`
8. ✅ Setup SSL: `certbot --nginx -d newsite.com`
9. ✅ Done! Site is live 🎉

---

**You can now host unlimited websites on your VPS!** 🚀

