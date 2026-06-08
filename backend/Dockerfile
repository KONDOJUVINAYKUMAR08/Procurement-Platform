FROM node:18-alpine

WORKDIR /app

# Copy the root package.json if needed
COPY package*.json ./
# Copy backend files
COPY backend ./backend

# Install dependencies (assuming there's a package.json in backend/ or root)
# The backend is currently structured with multiple services, 
# so we might need to run npm install from the root or inside backend/
RUN if [ -f "backend/package.json" ]; then cd backend && npm install; else npm install; fi

# Since we are using typescript, we should run build if a build script exists
RUN if [ -f "backend/package.json" ]; then cd backend && npm run build --if-present; else npm run build --if-present; fi

# Expose port (assuming 5000 is the gateway port)
EXPOSE 5000

# Start command
CMD ["npm", "start", "--prefix", "backend/gateway/api-gateway"]
