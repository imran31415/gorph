# Multi-stage build for Gorph application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY web/frontend/gorph-app/package*.json ./
COPY web/frontend/gorph-app/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY web/frontend/gorph-app/ ./

# Build the application
RUN yarn build

# Production stage - using nginx for static file serving
FROM nginx:alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 