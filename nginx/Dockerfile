# =====================================================
# Dockerfile - Nginx + Frontend Build
# =====================================================

# Stage 1: Build frontend
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Nginx with built frontend
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config will be mounted via docker-compose volume
