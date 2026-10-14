# ==============================================================================
# EnergyOps Workflow Platform - Angular Frontend
# Multi-Stage OCI Container Definition (Angular Build -> Nginx SPA Runner)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Angular Production Distribution
# ------------------------------------------------------------------------------
FROM node:20.14.0-alpine3.20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . ./

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Hardened Nginx Production Web Server
# ------------------------------------------------------------------------------
FROM nginx:1.27.0-alpine AS runner

# OCI Standard Annotations / Metadata
LABEL org.opencontainers.image.title="EnergyOps Frontend Web Application" \
      org.opencontainers.image.description="Modern Angular SPA for renewable energy workflow management and monitoring" \
      org.opencontainers.image.authors="EnergyOps Engineering <dev@energyops.internal>" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.vendor="EnergyOps" \
      org.opencontainers.image.source="https://github.com/Dhanya562004/energyops-workflow-platform"

# Install curl for reliable container health checking
RUN apk add --no-cache curl

# Remove default Nginx HTML placeholder
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled Angular production bundle from builder stage
COPY --from=builder /usr/src/app/dist/energyops-frontend/browser /usr/share/nginx/html

# Set non-root permissions for nginx cache and run directories
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html /etc/nginx/conf.d

USER nginx

EXPOSE 80

# Container Healthcheck (polls every 30s, expects 200 from /healthz)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
