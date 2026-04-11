# =====================================================
# Dockerfile - Backend Air Quality Monitoring
# =====================================================

FROM node:18-alpine

WORKDIR /app

# 1. Copy package files & install dependencies
COPY backend/package*.json ./
RUN npm ci --production

# 2. Copy Prisma schema & generate client
COPY backend/prisma/ ./prisma/
COPY backend/prisma.config.ts ./
RUN npx prisma generate

# 3. Copy backend source code
COPY backend/src/ ./src/
COPY backend/database/ ./database/

# 4. Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "src/server.js"]
