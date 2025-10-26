# 🌐 Web Deployment Guide (VPS)

Complete guide to deploying MobileToolsBox to a VPS (DigitalOcean/AWS/Linode) with full backend support.

## Prerequisites

- ✅ VPS account (DigitalOcean, AWS EC2, Linode, etc.)
- ✅ Domain name registered
- ✅ SSH client installed
- ✅ Production database (PostgreSQL)
- ✅ All API keys ready (SendGrid, Stripe, AdSense)

## Part 1: VPS Provisioning

### Option A: DigitalOcean (Recommended for Beginners)

1. **Create Droplet**:
   - Go to https://cloud.digitalocean.com
   - Click "Create" → "Droplets"
   - Choose:
     - **Image**: Ubuntu 22.04 LTS
     - **Plan**: Basic ($12/month - 2GB RAM, 1 CPU, 50GB SSD)
     - **Datacenter**: Choose closest to your users
     - **Authentication**: SSH keys (recommended) or password
     - **Hostname**: mobiletoolsbox
   - Create Droplet

2. **Note Your IP Address**: `123.45.67.89` (example)

### Option B: AWS EC2

1. **Launch Instance**:
   - Go to AWS EC2 Console
   - Launch Instance
   - Choose:
     - **AMI**: Ubuntu Server 22.04 LTS
     - **Instance type**: t3.small (2GB RAM)
     - **Storage**: 50GB gp3
     - **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)
   - Create key pair and download
   - Launch instance

2. **Note Your Elastic IP**: Allocate and associate an Elastic IP

## Part 2: Initial Server Setup

### Connect to Server

```bash
# DigitalOcean
ssh root@your-server-ip

# AWS (using key pair)
ssh -i your-key.pem ubuntu@your-server-ip
```

### Update System

```bash
apt update && apt upgrade -y
```

### Create Non-Root User (Security Best Practice)

```bash
# Create user
adduser mobiletoolsbox
usermod -aG sudo mobiletoolsbox

# Switch to new user
su - mobiletoolsbox
```

### Install Required Software

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Install PostgreSQL client (if database is local)
# sudo apt install -y postgresql postgresql-contrib
```

## Part 3: Application Deployment

### Setup Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/mobiletoolsbox
sudo chown -R $USER:$USER /var/www/mobiletoolsbox
cd /var/www/mobiletoolsbox
```

### Upload Your Code

#### Option A: Git Clone (Recommended)

```bash
# Clone your repository
git clone https://your-repo-url.git .

# Or if using GitHub
git clone https://github.com/yourusername/mobiletoolsbox.git .
```

#### Option B: SCP Upload

From your local machine:
```powershell
# Windows PowerShell
scp -r C:\Users\shadi\OneDrive\Desktop\projects\MobileMasterTool\* user@server-ip:/var/www/mobiletoolsbox/
```

### Configure Environment

```bash
cd /var/www/mobiletoolsbox

# Copy environment template
cp env.production.template .env.production

# Edit with actual values
nano .env.production
```

Fill in all required values:
```env
DATABASE_URL=postgresql://user:password@your-db-host:5432/mobiletoolsbox?sslmode=require
SESSION_SECRET=your-generated-secret-here
SENDGRID_API_KEY=SG.your-key-here
STRIPE_SECRET_KEY=sk_live_your-key-here
VITE_ADSENSE_CLIENT_ID=ca-pub-your-id-here
APP_URL=https://yourdomain.com
PORT=5000
NODE_ENV=production
```

Save with `Ctrl+X`, then `Y`, then `Enter`

### Install Dependencies

```bash
# Install production dependencies
npm install --production

# Or install all dependencies if you need dev tools
npm install
```

### Build Application

```bash
# Build the application
npm run build

# Verify build output
ls -lh dist/
```

## Part 4: Database Setup

### If Using DigitalOcean Managed Database

1. Create PostgreSQL database in DigitalOcean
2. Note connection details
3. Add to `.env.production`
4. Whitelist your VPS IP in database firewall

### If Using AWS RDS

1. Create RDS PostgreSQL instance
2. Configure security group to allow VPS access
3. Note endpoint and credentials
4. Add to `.env.production`

### Run Database Migrations

```bash
cd /var/www/mobiletoolsbox
npm run db:push
```

### Initialize Admin User (if script exists)

```bash
npm run init-admin
```

## Part 5: Nginx Configuration

### Create Nginx Config

```bash
# Copy the template
sudo cp nginx-config-template.conf /etc/nginx/sites-available/mobiletoolsbox

# Edit with your domain
sudo nano /etc/nginx/sites-available/mobiletoolsbox
```

Replace `yourdomain.com` with your actual domain throughout the file.

### Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mobiletoolsbox /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Part 6: Domain Configuration

### Point Domain to VPS

In your domain registrar (Namecheap, GoDaddy, etc.):

1. Add A record:
   - **Type**: A
   - **Host**: @
   - **Value**: your-vps-ip
   - **TTL**: 300 (5 minutes)

2. Add www subdomain:
   - **Type**: A
   - **Host**: www
   - **Value**: your-vps-ip
   - **TTL**: 300

3. Wait for DNS propagation (5-30 minutes)

### Verify DNS

```bash
# Check DNS resolution
dig yourdomain.com +short
# Should return your VPS IP

# Or use nslookup
nslookup yourdomain.com
```

## Part 7: SSL Certificate (HTTPS)

### Generate Certificate with Let's Encrypt

```bash
# Run certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)
```

### Verify SSL Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# If successful, renewal is configured automatically
```

### Verify HTTPS

Visit `https://yourdomain.com` in your browser - should show secure connection!

## Part 8: PM2 Process Management

### Start Application

```bash
cd /var/www/mobiletoolsbox

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs mobiletoolsbox

# Monitor
pm2 monit
```

### Configure PM2 Startup

```bash
# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup

# Copy and run the command that PM2 outputs
# It will look like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-user --hp /home/your-user
```

### PM2 Common Commands

```bash
# Restart app
pm2 restart mobiletoolsbox

# Stop app
pm2 stop mobiletoolsbox

# Delete app from PM2
pm2 delete mobiletoolsbox

# View logs
pm2 logs mobiletoolsbox --lines 100

# Flush logs
pm2 flush

# Monitor CPU/Memory
pm2 monit
```

## Part 9: Security Hardening

### Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Install Fail2Ban

```bash
# Install
sudo apt install -y fail2ban

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### Disable Root Login (Security)

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change:
```
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

## Part 10: Monitoring Setup

### Install PM2 Log Rotation

```bash
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Set Up Uptime Monitoring

1. **UptimeRobot** (Free):
   - Go to https://uptimerobot.com
   - Add new monitor
   - Type: HTTPS
   - URL: https://yourdomain.com
   - Interval: 5 minutes
   - Alert contacts: Your email

2. **Pingdom** (Paid, more features):
   - Alternative with more detailed monitoring

### Database Backups

#### DigitalOcean Managed Database

- Enable automatic backups in DigitalOcean control panel
- Configure retention period (7-30 days)

#### Self-Hosted PostgreSQL

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/mobiletoolsbox/backups"
DB_NAME="mobiletoolsbox"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*" -mtime +30 -delete
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

Add line:
```
0 2 * * * /home/mobiletoolsbox/backup-db.sh
```

## Part 11: Testing

### Test Checklist

- [ ] Visit https://yourdomain.com - loads correctly
- [ ] SSL certificate is valid (green lock icon)
- [ ] User registration works
- [ ] User login works
- [ ] All tools function correctly
- [ ] Data persists after refresh
- [ ] API endpoints work
- [ ] Mobile app can connect to API
- [ ] Email notifications work (if configured)
- [ ] Payments work (if configured)

### Performance Testing

```bash
# Install Apache Bench (optional)
sudo apt install apache2-utils

# Test server performance
ab -n 1000 -c 10 https://yourdomain.com/
```

## Part 12: Ongoing Maintenance

### Update Application

```bash
cd /var/www/mobiletoolsbox

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart mobiletoolsbox
```

### Monitor Logs

```bash
# Application logs
pm2 logs mobiletoolsbox

# Nginx logs
sudo tail -f /var/log/nginx/mobiletoolsbox_access.log
sudo tail -f /var/log/nginx/mobiletoolsbox_error.log

# System logs
sudo journalctl -u pm2-mobiletoolsbox -f
```

### Monitor Server Resources

```bash
# CPU and memory
htop

# Disk space
df -h

# PM2 monitoring
pm2 monit
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs mobiletoolsbox --err

# Check if port 5000 is in use
sudo lsof -i :5000

# Test Node.js directly
cd /var/www/mobiletoolsbox
NODE_ENV=production node dist/index.js
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -100 /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

### Database Connection Errors

- Verify `DATABASE_URL` in `.env.production`
- Check database is accessible: `psql $DATABASE_URL`
- Verify firewall allows connection
- Check database credentials

## Server Configuration Files

All configuration files are in project root:
- `ecosystem.config.js` - PM2 configuration
- `nginx-config-template.conf` - Nginx template
- `env.production.template` - Environment variables template

## Cost Estimate

- **VPS**: $10-20/month (DigitalOcean/AWS)
- **Managed Database**: $15-25/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$30-50/month

## Timeline

- **VPS Setup**: 30-60 minutes
- **Application Deploy**: 30-45 minutes
- **SSL Setup**: 10-15 minutes
- **Testing**: 30-60 minutes
- **Total**: 2-3 hours

## Next Steps After Deployment

1. Set up monitoring (UptimeRobot)
2. Configure automated backups
3. Test from multiple devices
4. Share with beta testers
5. Prepare for mobile app deployment

---

**Your web app will be live at https://yourdomain.com!** 🎉

