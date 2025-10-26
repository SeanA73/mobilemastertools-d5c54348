# 🚀 Quick VPS Deployment Guide

## Prerequisites
- ✅ VPS with Ubuntu 22.04 (DigitalOcean, AWS, Linode, etc.)
- ✅ Domain name (optional but recommended)
- ✅ SSH access to your VPS
- ✅ Database URL (PostgreSQL recommended)

## Option 1: Automated Deployment (Recommended)

### Step 1: Upload Your Code to VPS

#### Method A: Using Git (Recommended)
```bash
# On your VPS
ssh user@your-vps-ip

# Clone your repository
sudo mkdir -p /var/www/mobiletoolsbox
sudo chown -R $USER:$USER /var/www/mobiletoolsbox
cd /var/www/mobiletoolsbox
git clone https://github.com/yourusername/yourrepo.git .
```

#### Method B: Using SCP (From Windows)
```powershell
# From your local Windows machine (PowerShell)
cd C:\Users\shadi\OneDrive\Desktop\projects\MobileMasterTool

# Upload all files (replace user and VPS IP)
scp -r * user@your-vps-ip:/var/www/mobiletoolsbox/
```

### Step 2: Run Deployment Script
```bash
# On your VPS
cd /var/www/mobiletoolsbox
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

The script will:
- ✅ Install Node.js, PM2, Nginx
- ✅ Install dependencies
- ✅ Build your application
- ✅ Start with PM2
- ✅ Configure Nginx
- ✅ Guide you through SSL setup

---

## Option 2: Manual Deployment (Step by Step)

### Step 1: Connect to VPS
```bash
ssh user@your-vps-ip
```

### Step 2: Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Setup Application
```bash
# Create directory
sudo mkdir -p /var/www/mobiletoolsbox
sudo chown -R $USER:$USER /var/www/mobiletoolsbox
cd /var/www/mobiletoolsbox

# Upload your code here (via git clone or scp)
```

### Step 4: Configure Environment
```bash
# Create environment file
nano .env.production
```

Add these variables:
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
SESSION_SECRET=your-super-secret-session-key-min-32-chars
SENDGRID_API_KEY=SG.your-key-here
STRIPE_SECRET_KEY=sk_live_your-key-here
VITE_ADSENSE_CLIENT_ID=ca-pub-your-id-here
APP_URL=https://yourdomain.com
PORT=5000
NODE_ENV=production
```

Save with `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Install Dependencies & Build
```bash
# Install dependencies
npm install

# Build application
npm run build

# Verify build
ls -lh dist/
```

### Step 6: Start with PM2
```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Copy and run the command PM2 outputs

# Check status
pm2 status
pm2 logs mobiletoolsbox
```

### Step 7: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/mobiletoolsbox
```

Paste this configuration (replace `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

    client_max_body_size 10M;
}
```

Enable the site:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mobiletoolsbox /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 8: Setup SSL Certificate
```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS (Yes)

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

---

## Testing Your Deployment

### 1. Check Application Status
```bash
pm2 status
pm2 logs mobiletoolsbox --lines 50
```

### 2. Test Local Connection
```bash
curl http://localhost:5000
```

### 3. Test External Connection
```bash
# From your Windows machine
curl http://your-vps-ip
curl https://yourdomain.com
```

### 4. Open in Browser
Visit: `https://yourdomain.com`

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs mobiletoolsbox

# Restart application
pm2 restart mobiletoolsbox

# Stop application
pm2 stop mobiletoolsbox

# Monitor resources
pm2 monit

# View detailed info
pm2 show mobiletoolsbox
```

---

## Updating Your Application

```bash
# Connect to VPS
ssh user@your-vps-ip

# Navigate to app directory
cd /var/www/mobiletoolsbox

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart mobiletoolsbox

# Check logs
pm2 logs mobiletoolsbox --lines 20
```

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 PID

# Or change port in ecosystem.config.js
```

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs mobiletoolsbox --err

# Try running directly
cd /var/www/mobiletoolsbox
NODE_ENV=production node dist/index.js

# Check environment file
cat .env.production
```

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from VPS IP
- Check database firewall rules

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -100 /var/log/nginx/error.log

# Restart everything
pm2 restart mobiletoolsbox
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Security Checklist

- [ ] Changed default passwords
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Firewall (UFW) configured
- [ ] SSL certificate installed
- [ ] Database has strong password
- [ ] Environment variables secured
- [ ] Regular backups configured

---

## Cost Estimate

- **VPS**: $12-20/month (DigitalOcean/Linode)
- **Domain**: $10-15/year
- **Database**: $15-25/month (managed) or $0 (self-hosted)
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$30-50/month

---

## What You Get

✅ Your app running 24/7  
✅ HTTPS encryption  
✅ Auto-restart on crashes  
✅ Professional domain name  
✅ API access for mobile apps  
✅ Email functionality  
✅ Data persistence  

---

## Need Help?

- **Full Guide**: See `WEB_DEPLOYMENT_GUIDE.md`
- **Android**: See `ANDROID_DEPLOYMENT_GUIDE.md`
- **iOS**: See `IOS_DEPLOYMENT_GUIDE.md`

---

**Your web app will be live at `https://yourdomain.com`!** 🎉

