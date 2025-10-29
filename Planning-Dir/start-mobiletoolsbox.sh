#!/bin/bash

# Script to start mobiletoolsbox with PM2 and load environment variables

cd /var/www/mobiletoolsbox

# Load environment variables from .env.production
export $(cat .env.production | grep -v '^#' | xargs)

# Start PM2 with the loaded environment
pm2 start dist/index.js --name mobiletoolsbox --update-env

# Save PM2 configuration
pm2 save

# Show status
pm2 status

# Show logs
pm2 logs mobiletoolsbox --lines 20

echo "✅ mobiletoolsbox started!"

