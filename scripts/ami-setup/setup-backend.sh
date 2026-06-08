#!/bin/bash
# ============================================================
# Backend AMI Setup Script — Ubuntu 22.04 LTS
# Procurement Platform — Node.js API Gateway via PM2
# ============================================================
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "======================================================"
echo " [1/6] Updating OS packages..."
echo "======================================================"
apt-get update -y
apt-get upgrade -y
apt-get install -y git curl unzip

echo "======================================================"
echo " [2/6] Installing Node.js 20 (via NodeSource)..."
echo "======================================================"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

node --version
npm --version

echo "======================================================"
echo " [3/6] Installing PM2 globally..."
echo "======================================================"
npm install -g pm2

echo "======================================================"
echo " [4/6] Installing project dependencies..."
echo "======================================================"
PROJECT_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$PROJECT_ROOT"
npm run bootstrap   # alias for npm install (hoists all workspace deps)

echo "======================================================"
echo " [5/6] Building backend TypeScript workspaces..."
echo "======================================================"
npm run build:backend

echo "======================================================"
echo " [6/6] Starting API Gateway with PM2 + persisting..."
echo "======================================================"
# ──────────────────────────────────────────────────────────
# Environment variables for the API Gateway:
#
#   NODE_ENV     → enables production AWS connections (DynamoDB, Secrets Manager)
#   PORT         → 5000 (Internal ALB targets this port)
#   AWS_REGION   → your AWS region
#   SECRET_NAME  → the Secrets Manager secret path to load config from
#
# At startup, the app calls getSecrets(SECRET_NAME) which automatically
# fetches JWT secrets, S3 bucket, KMS key ID — no hardcoding needed.
# IAM Instance Profile provides auth — no AWS_ACCESS_KEY_ID needed.
# ──────────────────────────────────────────────────────────

NODE_ENV=production \
PORT=5000 \
AWS_REGION=us-east-1 \
SECRET_NAME=procurement/dev/app-config \
  pm2 start "$PROJECT_ROOT/backend/gateway/api-gateway/dist/index.js" \
    --name "procurement-api-gateway" \
    -i max

pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo "======================================================"
echo " Backend setup complete!"
echo " ✓ Node.js $(node --version) installed"
echo " ✓ API Gateway running on port 5000 (PM2 cluster mode)"
echo " ✓ DynamoDB: connected via IAM Instance Profile"
echo " ✓ Secrets Manager secret: procurement/dev/app-config"
echo " ✓ S3 + KMS: loaded from Secrets Manager config"
echo ""
echo " Test with:  curl http://localhost:5000/api/health"
echo " View logs:  pm2 logs procurement-api-gateway"
echo "======================================================"
