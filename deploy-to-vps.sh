#!/bin/bash
# MobileToolsBox VPS Deployment Script
# Usage: Run this script on your VPS (Ubuntu/Debian)

set -e  # Exit on error

echo "🚀 MobileToolsBox VPS Deployment"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running on VPS (not Windows)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    print_error "This script should be run on your VPS (Linux), not Windows!"
    exit 1
fi

# Step 1: Check prerequisites
echo ""
echo "Step 1: Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not installed!"
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
    sudo apt install -y nodejs
    print_success "Node.js installed"
fi

# Check PM2
if command -v pm2 &> /dev/null; then
    print_success "PM2 installed"
else
    print_warning "PM2 not installed. Installing..."
    sudo npm install -g pm2
    print_success "PM2 installed"
fi

# Check Nginx
if command -v nginx &> /dev/null; then
    print_success "Nginx installed"
else
    print_warning "Nginx not installed. Installing..."
    sudo apt install -y nginx
    print_success "Nginx installed"
fi

# Step 2: Setup application directory
echo ""
echo "Step 2: Setting up application directory..."

APP_DIR="/var/www/mobiletoolsbox"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    print_success "Created directory: $APP_DIR"
else
    print_success "Directory exists: $APP_DIR"
fi

cd "$APP_DIR"

# Step 3: Install dependencies
echo ""
echo "Step 3: Installing dependencies..."

if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_error "package.json not found! Make sure you've uploaded your code to $APP_DIR"
    exit 1
fi

# Step 4: Check environment file
echo ""
echo "Step 4: Checking environment configuration..."

if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found!"
    if [ -f "env.production.template" ]; then
        echo "Creating .env.production from template..."
        cp env.production.template .env.production
        print_warning "Please edit .env.production with your actual values:"
        print_warning "  nano .env.production"
        echo ""
        read -p "Press Enter after you've configured .env.production..."
    else
        print_error "No environment template found!"
        exit 1
    fi
else
    print_success ".env.production exists"
fi

# Step 5: Build application
echo ""
echo "Step 5: Building application..."

npm run build
print_success "Application built successfully"

# Step 6: Setup PM2
echo ""
echo "Step 6: Setting up PM2..."

# Stop existing process if running
if pm2 list | grep -q "mobiletoolsbox"; then
    pm2 stop mobiletoolsbox
    pm2 delete mobiletoolsbox
    print_warning "Stopped existing process"
fi

# Start application
pm2 start ecosystem.config.js
pm2 save
print_success "Application started with PM2"

# Setup startup script
if ! pm2 startup | grep -q "already configured"; then
    print_warning "Setting up PM2 startup script..."
    echo "Please run the following command that PM2 outputs:"
    pm2 startup
fi

# Step 7: Setup Nginx (if not already configured)
echo ""
echo "Step 7: Checking Nginx configuration..."

NGINX_CONF="/etc/nginx/sites-available/mobiletoolsbox"
if [ ! -f "$NGINX_CONF" ]; then
    print_warning "Nginx config not found. Setting up..."
    
    if [ -f "nginx-config-template.conf" ]; then
        sudo cp nginx-config-template.conf "$NGINX_CONF"
        print_warning "Please edit $NGINX_CONF and update:"
        print_warning "  - Replace 'yourdomain.com' with your actual domain"
        print_warning "  sudo nano $NGINX_CONF"
        echo ""
        read -p "Press Enter after updating the Nginx config..."
        
        # Enable site
        sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/mobiletoolsbox
        
        # Test configuration
        if sudo nginx -t; then
            print_success "Nginx configuration valid"
            sudo systemctl reload nginx
            print_success "Nginx reloaded"
        else
            print_error "Nginx configuration invalid! Please fix errors."
            exit 1
        fi
    else
        print_error "nginx-config-template.conf not found!"
    fi
else
    print_success "Nginx already configured"
    # Reload anyway
    sudo nginx -t && sudo systemctl reload nginx
fi

# Step 8: Status check
echo ""
echo "Step 8: Checking application status..."

pm2 status
pm2 logs mobiletoolsbox --lines 20

# Step 9: SSL Setup reminder
echo ""
echo "=============================="
print_success "Deployment Complete!"
echo "=============================="
echo ""
print_warning "Next Steps:"
echo ""
echo "1. Ensure your domain DNS points to this server's IP"
echo "2. Setup SSL certificate:"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "3. Monitor your application:"
echo "   pm2 logs mobiletoolsbox"
echo "   pm2 monit"
echo ""
echo "4. Test your application:"
echo "   curl http://localhost:5000"
echo "   curl http://your-domain.com"
echo ""
print_success "Your app should be running at http://your-server-ip:5000"
echo ""

# Show application logs
echo "Recent logs:"
pm2 logs mobiletoolsbox --lines 10 --nostream

