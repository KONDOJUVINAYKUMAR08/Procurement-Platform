# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY backend/shared/types/package.json ./backend/shared/types/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/middleware/package.json ./backend/shared/middleware/
COPY backend/shared/utils/package.json ./backend/shared/utils/

COPY backend/services/finance-service/package.json ./backend/services/finance-service/

# Install dependencies
RUN npm install

# Copy source code for shared and this specific service
COPY backend/shared ./backend/shared
COPY backend/services/finance-service ./backend/services/finance-service
COPY tsconfig.base.json ./

# Build shared packages and this service
RUN npm run build:backend --workspace=@procurement/types --workspace=@procurement/common --workspace=@procurement/utils --workspace=@procurement/middleware --workspace=@procurement/finance-service

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

COPY --from=builder /app/backend/services/finance-service/dist ./backend/services/finance-service/dist
COPY --from=builder /app/backend/services/finance-service/package.json ./backend/services/finance-service/

RUN npm ci --omit=dev

ENV NODE_ENV=production
EXPOSE 5002

CMD ["node", "backend/services/finance-service/dist/server.js"]
