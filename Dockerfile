# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (using wildcard to grab all package.json files from workspace)
COPY package.json package-lock.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/

COPY backend/services/identity-service/package.json ./backend/services/identity-service/
COPY backend/services/procurement-service/package.json ./backend/services/procurement-service/
COPY backend/services/finance-service/package.json ./backend/services/finance-service/
COPY backend/services/document-service/package.json ./backend/services/document-service/

COPY backend/gateway/api-gateway/package.json ./backend/gateway/api-gateway/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build all workspaces
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# We need the monorepo root package.json for workspaces to function at runtime
COPY package.json package-lock.json ./

# Copy built code
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

COPY --from=builder /app/frontend/build ./frontend/build

# Install production dependencies only using workspaces
RUN npm ci --omit=dev

ENV NODE_ENV=production
EXPOSE 5000
EXPOSE 3000

CMD ["node", "backend/gateway/api-gateway/dist/index.js"]
