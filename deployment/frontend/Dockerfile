# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only dependency files first for better caching
COPY package*.json ./

# Install dependencies (no dev dependencies for faster, smaller builds)
RUN npm ci

# Copy project files
COPY tsconfig.json vite.config.ts postcss.config.js tailwind.config.ts components.json ./
COPY client ./client
COPY shared ./shared
COPY attached_assets ./attached_assets

# Build the production bundle
RUN npx vite build

# ---------- Stage 2: Production ----------
FROM nginx:1.27-alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Copy custom Nginx configuration (if any)
COPY deployment/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Use non-root user for security (optional but recommended)
# RUN adduser -D appuser
# USER appuser

# Expose port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
