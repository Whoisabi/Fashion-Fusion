# ---------- Stage 1: Build Backend ----------
# Allow the base node image to be supplied via build-arg so builds can use
# Amazon ECR Public images or a private mirror without editing the Dockerfile.
ARG BASE_NODE_IMAGE=node:20-alpine
FROM ${BASE_NODE_IMAGE} AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (needed for build)
RUN npm ci

# Copy config files
COPY tsconfig.json tsconfig.server.json vite.config.ts drizzle.config.ts ./

# Copy source files
COPY server ./server
COPY shared ./shared
COPY types ./types

# Build the backend only
RUN npm run build:server

# ---------- Stage 2: Runtime ----------
FROM ${BASE_NODE_IMAGE}

WORKDIR /app

# Install postgresql-client for pg_isready and curl for health checks
RUN apk add --no-cache postgresql-client curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (keep dev deps for tsx, drizzle-kit)
RUN npm ci

# Copy built backend from builder
COPY --from=builder /app/dist ./dist

# Copy source files needed at runtime
COPY shared ./shared
COPY server ./server
COPY migrations ./migrations
COPY drizzle.config.ts ./drizzle.config.ts
COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.server.json ./tsconfig.server.json

# Copy and set up the entrypoint script
COPY deployment/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use non-root user (recommended for production)
# RUN addgroup -S app && adduser -S app -G app
# USER app

ENTRYPOINT ["docker-entrypoint.sh"]
