# Production Dockerfile for Institutional Algorithmic MT5 Trading Platform
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Python & Node Runtime Stage
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js in python environment
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy requirements and install python packages
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy package.json & install production node modules
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and server files
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/server.ts ./
COPY --from=frontend-builder /app/bot ./bot
COPY --from=frontend-builder /app/vite.config.ts ./
COPY --from=frontend-builder /app/tsconfig.json ./

# Expose HTTP API & Dashboard Port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start compiled server
CMD ["node", "dist/server.cjs"]
