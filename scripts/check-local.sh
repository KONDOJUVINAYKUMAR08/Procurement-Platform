#!/usr/bin/env bash
# Pre-flight checklist and validation script for Procurement Platform

# Exit on error
set -e

# Setup colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}   ProcureFlow – Local Pre-flight Verification      ${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# 1. Check Node.js installation
echo -e "${BLUE}[1/6] Checking Node.js environment...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js (v18+ recommended).${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${YELLOW}⚠️ Warning: Node.js version is $NODE_VERSION. Version 18+ is recommended for security and compatibility.${NC}"
else
    echo -e "${GREEN}✅ Node.js $NODE_VERSION is installed.${NC}"
fi

# 2. Check npm installation
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed. Please install npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) is installed.${NC}"
echo ""

# 3. Check environment configuration
echo -e "${BLUE}[2/6] Checking configuration files...${NC}"
if [ ! -f "server/.env" ]; then
    if [ -f "server/.env.example" ]; then
        echo -e "${YELLOW}⚠️ server/.env not found. Creating server/.env from .env.example...${NC}"
        cp server/.env.example server/.env
        echo -e "${GREEN}✅ Created server/.env file.${NC}"
    else
        echo -e "${RED}❌ Error: server/.env and server/.env.example are both missing!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ server/.env configuration file exists.${NC}"
fi
echo ""

# 4. Install dependencies
echo -e "${BLUE}[3/6] Installing dependencies (this may take a moment)...${NC}"
echo "Installing root dependencies..."
npm install --no-audit --no-fund > /dev/null

echo "Installing server dependencies..."
cd server
npm install --no-audit --no-fund > /dev/null
cd ..

echo "Installing client dependencies..."
cd client
npm install --no-audit --no-fund --legacy-peer-deps > /dev/null
cd ..
echo -e "${GREEN}✅ All dependencies successfully installed.${NC}"
echo ""

# 5. Check MongoDB connection
echo -e "${BLUE}[4/6] Checking MongoDB connectivity...${NC}"
# Extract MONGODB_URI from server/.env or default to localhost
MONGO_URI=$(grep -E "^MONGODB_URI=" server/.env | cut -d'=' -f2- || echo "mongodb://localhost:27017/procurement")
# Clean up carriage returns from grep if on Windows / WSL
MONGO_URI=$(echo "$MONGO_URI" | tr -d '\r')

echo "Attempting to connect to: $MONGO_URI"
if node -e "
const mongoose = require('mongoose');
const uri = '$MONGO_URI';
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err.message); process.exit(1); });
" 2>/dev/null; then
    echo -e "${GREEN}✅ Successfully connected to MongoDB.${NC}"
else
    echo -e "${RED}❌ Error: Could not connect to MongoDB server.${NC}"
    echo -e "${YELLOW}   Please check that MongoDB is running locally or that your MONGODB_URI in server/.env is correct.${NC}"
    echo -e "${YELLOW}   To start MongoDB locally (Ubuntu): sudo systemctl start mongod${NC}"
    exit 1
fi
echo ""

# 6. Seed Database
echo -e "${BLUE}[5/6] Seeding the database to verify writing capabilities...${NC}"
cd server
if npm run seed > /dev/null; then
    echo -e "${GREEN}✅ Database seeded successfully with demo accounts.${NC}"
else
    echo -e "${RED}❌ Error: Database seeding failed.${NC}"
    cd ..
    exit 1
fi
cd ..
echo ""

# 7. Compiling / Building Services
echo -e "${BLUE}[6/6] Verifying applications compilation...${NC}"
echo "Building server (TypeScript compilation)..."
cd server
if npm run build > /dev/null; then
    echo -e "${GREEN}✅ Express server compiled successfully.${NC}"
else
    echo -e "${RED}❌ Error: Express server compilation failed.${NC}"
    cd ..
    exit 1
fi
cd ..

echo "Building client (React production build)..."
cd client
# Run build with relative path URL so client requests route relative to the host
if REACT_APP_API_URL=/api npm run build > /dev/null; then
    echo -e "${GREEN}✅ React client built successfully.${NC}"
else
    echo -e "${RED}❌ Error: React client build failed.${NC}"
    cd ..
    exit 1
fi
cd ..
echo ""

echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}   🎉 ALL CHECKS PASSED SUCCESSFULLY!               ${NC}"
echo -e "${GREEN}   Application is verified and ready for deployment. ${NC}"
echo -e "${GREEN}===================================================${NC}"
