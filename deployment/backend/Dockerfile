# ---------- Stage 1: Build Backend ----------
ARG BASE_NODE_IMAGE=node:20-alpine
FROM ${BASE_NODE_IMAGE} AS builder

WORKDIR /app

# Copy only dependency files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy config and source files
COPY tsconfig.json tsconfig.server.json vite.config.ts drizzle.config.ts ./
COPY server ./server
COPY shared ./shared
COPY types ./types

# Build the backend
RUN npm run build:server

# ---------- Stage 2: Runtime ----------
FROM ${BASE_NODE_IMAGE}

WORKDIR /app

# Install tools for health checks
RUN apk add --no-cache postgresql-client curl

# Copy package files and install runtime deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built backend from builder
COPY --from=builder /app/dist ./dist

# Copy migrations and config needed at runtime
COPY migrations ./migrations
COPY drizzle.config.ts ./drizzle.config.ts
COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.server.json ./tsconfig.server.json
COPY shared ./shared
COPY server ./server

# Copy entrypoint and make executable
COPY deployment/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
