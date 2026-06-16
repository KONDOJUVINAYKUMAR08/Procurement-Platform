# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/

# Since API Gateway imports ALL microservices, we need their package.jsons
COPY backend/services/identity-service/package.json ./backend/services/identity-service/
COPY backend/services/procurement-service/package.json ./backend/services/procurement-service/
COPY backend/services/finance-service/package.json ./backend/services/finance-service/
COPY backend/services/document-service/package.json ./backend/services/document-service/

COPY backend/gateway/api-gateway/package.json ./backend/gateway/api-gateway/

# Install dependencies
RUN npm install

# Copy source code for everything the API Gateway needs
COPY backend/shared ./backend/shared
COPY backend/services ./backend/services
COPY backend/gateway/api-gateway ./backend/gateway/api-gateway
COPY backend/scripts ./backend/scripts
COPY tsconfig.base.json ./

# Build all backend workspaces
RUN npm run build:backend

# Compile the seed and bootstrap scripts
RUN npx tsc backend/scripts/seed.ts --resolveJsonModule --esModuleInterop --target es2020 --module commonjs --skipLibCheck true
RUN npx tsc backend/scripts/bootstrap-admin.ts --resolveJsonModule --esModuleInterop --target es2020 --module commonjs --skipLibCheck true

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/backend/shared/types/dist ./backend/shared/types/dist
COPY --from=builder /app/backend/shared/types/package.json ./backend/shared/types/

COPY --from=builder /app/backend/shared/common/dist ./backend/shared/common/dist
COPY --from=builder /app/backend/shared/common/package.json ./backend/shared/common/

COPY --from=builder /app/backend/shared/middleware/dist ./backend/shared/middleware/dist
COPY --from=builder /app/backend/shared/middleware/package.json ./backend/shared/middleware/

COPY --from=builder /app/backend/shared/utils/dist ./backend/shared/utils/dist
COPY --from=builder /app/backend/shared/utils/package.json ./backend/shared/utils/

COPY --from=builder /app/backend/services/identity-service/dist ./backend/services/identity-service/dist
COPY --from=builder /app/backend/services/identity-service/package.json ./backend/services/identity-service/

COPY --from=builder /app/backend/services/procurement-service/dist ./backend/services/procurement-service/dist
COPY --from=builder /app/backend/services/procurement-service/package.json ./backend/services/procurement-service/

COPY --from=builder /app/backend/services/finance-service/dist ./backend/services/finance-service/dist
COPY --from=builder /app/backend/services/finance-service/package.json ./backend/services/finance-service/

COPY --from=builder /app/backend/services/document-service/dist ./backend/services/document-service/dist
COPY --from=builder /app/backend/services/document-service/package.json ./backend/services/document-service/

COPY --from=builder /app/backend/gateway/api-gateway/dist ./backend/gateway/api-gateway/dist
COPY --from=builder /app/backend/gateway/api-gateway/package.json ./backend/gateway/api-gateway/

# Copy compiled seed and bootstrap scripts
COPY --from=builder /app/backend/scripts/seed.js ./backend/scripts/seed.js
COPY --from=builder /app/backend/scripts/bootstrap-admin.js ./backend/scripts/bootstrap-admin.js

RUN npm ci --omit=dev

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "backend/gateway/api-gateway/dist/index.js"]
