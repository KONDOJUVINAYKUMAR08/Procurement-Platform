#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       ProcureFlow – Procurement & Vendor Management          ║"
echo "║       Setup Script                                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check MongoDB
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found"
else
    echo -e "${YELLOW}⚠️  MongoDB not found locally. You can use Docker or MongoDB Atlas.${NC}"
fi

echo ""
echo "📦 Installing server dependencies..."
cd server && npm install 2>/dev/null
echo -e "${GREEN}✅ Server dependencies installed${NC}"

echo ""
echo "📦 Installing client dependencies..."
cd ../client && npm install --legacy-peer-deps 2>/dev/null
echo -e "${GREEN}✅ Client dependencies installed${NC}"

echo ""
echo "📦 Installing root dependencies..."
cd .. && npm install 2>/dev/null
echo -e "${GREEN}✅ Root dependencies installed${NC}"

echo ""
echo "⚙️  Configuring environment..."
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo -e "${GREEN}✅ Created server/.env from .env.example${NC}"
    echo -e "${YELLOW}⚠️  Please edit server/.env with your MongoDB URI and other settings${NC}"
else
    echo "✅ server/.env already exists"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup complete!                                          ║"
echo "║                                                              ║"
echo "║  To start the application:                                   ║"
echo "║                                                              ║"
echo "║  1. Start MongoDB:                                           ║"
echo "║     docker run -d -p 27017:27017 mongo:7                     ║"
echo "║                                                              ║"
echo "║  2. Seed the database:                                       ║"
echo "║     cd server && npm run seed                                ║"
echo "║                                                              ║"
echo "║  3. Start development servers:                               ║"
echo "║     npm run dev                                              ║"
echo "║                                                              ║"
echo "║  4. Open http://localhost:3000                               ║"
echo "║                                                              ║"
echo "║  Demo Accounts:                                              ║"
echo "║     admin@procurement.com / admin123                         ║"
echo "║     manager@procurement.com / manager123                     ║"
echo "║     finance@procurement.com / finance123                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
