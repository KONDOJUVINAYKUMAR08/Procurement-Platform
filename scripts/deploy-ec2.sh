#!/usr/bin/env bash
# Deployment script for ProcureFlow Procurement Platform on a single Ubuntu EC2 instance.
# Run this script as root or with sudo: sudo ./scripts/deploy-ec2.sh

# Exit on error
set -e

# Setup colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}   ProcureFlow – Manual EC2 Deployment Script       ${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# Ensure script is run with sudo/root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script with sudo or as root:${NC}"
  echo "sudo ./scripts/deploy-ec2.sh"
  exit 1
fi

# Detect application root path (assuming script is run from project root/scripts folder)
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}📍 Application directory identified as: $APP_DIR${NC}"
cd "$APP_DIR"

# 1. System Update
echo -e "${BLUE}[1/8] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y
apt-get install -y curl gnupg git build-essential ufw
echo -e "${GREEN}✅ System packages updated.${NC}"
echo ""

# 2. Install MongoDB 7.0 Community Edition
echo -e "${BLUE}[2/8] Installing MongoDB 7.0 Community Edition...${NC}"
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       gpg --o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    apt-get update -y
    apt-get install -y mongodb-org
    
    # Start and enable MongoDB daemon
    systemctl start mongod
    systemctl enable mongod
    echo -e "${GREEN}✅ MongoDB 7.0 installed, started, and enabled on boot.${NC}"
else
    echo -e "${GREEN}✅ MongoDB is already installed.${NC}"
    systemctl start mongod || true
fi
echo ""

# 3. Install Node.js v20.x LTS
echo -e "${BLUE}[3/8] Installing Node.js v20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js $(node -v) and npm $(npm -v) installed.${NC}"
else
    echo -e "${GREEN}✅ Node.js $(node -v) is already installed.${NC}"
fi
echo ""

# 4. Install PM2 (Process Manager)
echo -e "${BLUE}[4/8] Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed globally.${NC}"
else
    echo -e "${GREEN}✅ PM2 is already installed.${NC}"
fi
echo ""

# 5. Configure Nginx Reverse Proxy
echo -e "${BLUE}[5/8] Installing and configuring Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi

# Create Nginx site config
cat > /etc/nginx/sites-available/procurement << 'EOF'
server {
    listen 80;
    server_name _; # Responds to any IP or domain mapped to this instance

    # Adjust client body size limit for document uploads
    client_max_body_size 15M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site and disable default Nginx site if it exists
ln -sf /etc/nginx/sites-available/procurement /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Restart Nginx to apply changes
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx reverse proxy configured and started on port 80.${NC}"
echo ""

# 6. Configure Firewall (UFW)
echo -e "${BLUE}[6/8] Configuring Firewall (UFW)...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Expose port 5000 just in case, though port 80 is the main entrypoint
ufw allow 5000/tcp
echo "y" | ufw enable
echo -e "${GREEN}✅ UFW Firewall enabled with SSH and Nginx allowed.${NC}"
echo ""

# 7. Setup Application Environment and Files
echo -e "${BLUE}[7/8] Setting up Application Dependencies and Building...${NC}"

# Configure environment if not present
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    # Generate random JWT secrets automatically
    JWT_SECRET_RAND=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_REFRESH_RAND=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET_RAND/" server/.env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_RAND/" server/.env
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" server/.env
    
    echo -e "${GREEN}✅ Created server/.env with production defaults and secure JWT keys.${NC}"
else
    # Ensure NODE_ENV is set to production
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" server/.env
    echo -e "${GREEN}✅ server/.env already exists (ensured NODE_ENV=production).${NC}"
fi

# Install dependencies and build
echo "Installing dependencies..."
npm install --no-audit --no-fund
cd server && npm install --no-audit --no-fund && cd ..
cd client && npm install --no-audit --no-fund --legacy-peer-deps && cd ..

echo "Building applications..."
cd server && npm run build && cd ..
cd client && REACT_APP_API_URL=/api npm run build && cd ..
echo -e "${GREEN}✅ Applications built successfully.${NC}"
echo ""

# 8. Seed and Run via PM2
echo -e "${BLUE}[8/8] Seeding database and starting PM2 processes...${NC}"

# Get the non-root user who invoked sudo (fallback to root if run directly)
REAL_USER=${SUDO_USER:-$USER}
REAL_HOMEDIR=$(eval echo ~$REAL_USER)

# Create logs directory and assign permissions to real user
mkdir -p logs
chown -R $REAL_USER:$REAL_USER logs

# Seed Database
echo "Running database seeder..."
cd server && npm run seed && cd ..

# Start backend using PM2 as the real user
echo "Configuring PM2 for user '$REAL_USER'..."
sudo -u $REAL_USER pm2 delete procurement-app || true

# Start Node App in production mode as the real user
sudo -u $REAL_USER pm2 start server/dist/index.js --name "procurement-app" --update-env

# Save PM2 state and configure startup service for the real user
sudo -u $REAL_USER pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u $REAL_USER --hp $REAL_HOMEDIR || true

echo ""
echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}   🎉 DEPLOYMENT SETUP COMPLETED SUCCESSFULLY!      ${NC}"
echo -e "${GREEN}                                                   ${NC}"
echo -e "${GREEN}   Your procurement platform is now running!       ${NC}"
echo -e "${GREEN}   Access it here: http://<your-ec2-public-ip>     ${NC}"
echo -e "${GREEN}                                                   ${NC}"
echo -e "${GREEN}   Demo Accounts:                                  ${NC}"
echo -e "${GREEN}     - Admin: admin@procurement.com / admin123     ${NC}"
echo -e "${GREEN}     - Manager: manager@procurement.com / manager123 ${NC}"
echo -e "${GREEN}     - Finance: finance@procurement.com / finance123 ${NC}"
echo -e "${GREEN}                                                   ${NC}"
echo -e "${GREEN}   To check application status: pm2 status          ${NC}"
echo -e "${GREEN}   To view logs: pm2 logs procurement-app          ${NC}"
echo -e "${GREEN}===================================================${NC}"
