# ==============================================================================
# EnergyOps Workflow Platform - Backend REST & GraphQL API
# Multi-Stage OCI Container Definition
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Compile TypeScript
# ------------------------------------------------------------------------------
FROM node:20.14.0-alpine3.20 AS builder

# Install build dependencies for better-sqlite3 native C++ addon
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runner
# ------------------------------------------------------------------------------
FROM node:20.14.0-alpine3.20 AS runner

# OCI Standard Annotations / Metadata
LABEL org.opencontainers.image.title="EnergyOps Operations API" \
      org.opencontainers.image.description="High-throughput workflow & state-machine backend for renewable energy operations" \
      org.opencontainers.image.authors="EnergyOps Engineering <dev@energyops.internal>" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.vendor="EnergyOps" \
      org.opencontainers.image.source="https://github.com/Dhanya562004/energyops-workflow-platform"

# Install curl for reliable container health checking
RUN apk add --no-cache curl

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/usr/src/app/data/energyops.db

# Ensure persistent data directory with proper non-root permissions
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app

# Copy production dependencies & build artifacts
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/src/db/schema.sql ./dist/db/schema.sql
COPY --chown=node:node --from=builder /usr/src/app/package*.json ./

# Switch to least-privilege non-root user
USER node

EXPOSE 3000

# Container Healthcheck (polls every 30s, expects 200 from /api/health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
