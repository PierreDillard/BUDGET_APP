# Budget App - Full Stack Dockerfile
# This builds both frontend and backend in a single optimized container

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser

# Set working directory
WORKDIR /app

# Copy root package.json
COPY package*.json ./

# ================================
# FRONTEND BUILD STAGE
# ================================
FROM base AS frontend-builder

# Copy frontend source
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install frontend dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Build frontend
RUN npm run build

# ================================
# BACKEND BUILD STAGE
# ================================
FROM base AS backend-builder

# Copy backend source
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/
COPY backend/nest-cli.json ./backend/
COPY backend/tsconfig*.json ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Install backend dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN npm run build

# ================================
# PRODUCTION STAGE
# ================================
FROM base AS production

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy built backend from builder stage
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./public

# Copy scripts and configuration
COPY backend/healthcheck.js ./
COPY scripts/start-production.sh ./
RUN chmod +x start-production.sh

# Create directories and set permissions
RUN mkdir -p logs uploads \
    && chown -R appuser:nodejs /app \
    && chmod -R 755 /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["./start-production.sh"]
