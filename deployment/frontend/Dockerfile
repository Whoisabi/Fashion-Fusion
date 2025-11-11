# ---------- Stage 1: Build ----------
ARG BASE_NODE_IMAGE=node:20-alpine
ARG BASE_NGINX_IMAGE=nginx:1.27-alpine
FROM ${BASE_NODE_IMAGE} AS builder

# Set working directory
WORKDIR /app

# Copy only dependency files first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY tsconfig.json vite.config.ts postcss.config.js tailwind.config.ts components.json ./
COPY client ./client
COPY shared ./shared

# Build the production bundle
RUN npm run build --prefix client

# ---------- Stage 2: Production ----------
FROM ${BASE_NGINX_IMAGE}

# Copy built frontend assets from builder
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY deployment/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
