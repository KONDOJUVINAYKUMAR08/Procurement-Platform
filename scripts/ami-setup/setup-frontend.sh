#!/bin/bash
# ============================================================
# Frontend AMI Setup Script — Ubuntu 22.04 LTS
# Procurement Platform — React App served by Nginx
# ============================================================
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "======================================================"
echo " [1/6] Updating OS packages..."
echo "======================================================"
apt-get update -y
apt-get upgrade -y
apt-get install -y git curl nginx

echo "======================================================"
echo " [2/6] Installing Node.js 20 (via NodeSource)..."
echo "======================================================"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

node --version
npm --version

echo "======================================================"
echo " [3/6] Installing project dependencies..."
echo "======================================================"
PROJECT_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$PROJECT_ROOT"
npm run bootstrap   # installs all workspace dependencies

echo "======================================================"
echo " [4/6] Building the React frontend..."
echo "======================================================"
# REACT_APP_API_URL is baked into the JS bundle at build time.
# It must point to the Internal ALB DNS so the React app can
# call the backend API. Set this before running this script:
#
#   echo "REACT_APP_API_URL=http://<INTERNAL_ALB_DNS>" > "$PROJECT_ROOT/frontend/.env"
#
# If the .env file already exists (set before running this script), use it.
# Otherwise fall back to a placeholder that must be replaced.

if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
  echo "⚠️  WARNING: No .env file found for frontend!"
  echo "⚠️  Create $PROJECT_ROOT/frontend/.env with:"
  echo "⚠️    REACT_APP_API_URL=http://<your-internal-alb-dns>"
  echo "⚠️  Then rebuild with: cd $PROJECT_ROOT && npm run build:frontend"
fi

npm run build:frontend

echo "======================================================"
echo " [5/6] Deploying built files to Nginx web root..."
echo "======================================================"
rm -rf /var/www/html/*
cp -r "$PROJECT_ROOT/frontend/build/"* /var/www/html/

echo "======================================================"
echo " [6/6] Configuring Nginx as reverse proxy..."
echo "======================================================"
# Remove default Nginx config
rm -f /etc/nginx/sites-enabled/default

# Write procurement Nginx config
cat > /etc/nginx/sites-available/procurement << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    # React SPA — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip for performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_CONFIG

# Enable the config
ln -sf /etc/nginx/sites-available/procurement /etc/nginx/sites-enabled/procurement

# Test Nginx config is valid
nginx -t

# Enable and start Nginx
systemctl enable nginx
systemctl restart nginx

echo ""
echo "======================================================"
echo " Frontend setup complete!"
echo " ✓ Node.js $(node --version) installed"
echo " ✓ React app built and served by Nginx on port 80"
echo " ✓ React → Backend via REACT_APP_API_URL in .env"
echo ""
echo " Test with:  curl http://localhost"
echo " If you see HTML output, the frontend is working."
echo "======================================================"
