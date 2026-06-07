# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source
COPY . .

# Build
RUN cd server && npm run build
RUN cd client && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/build ./client/build

COPY --from=builder /app/client/node_modules ./client/node_modules
COPY --from=builder /app/client/package.json ./client/

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/dist/index.js"]
