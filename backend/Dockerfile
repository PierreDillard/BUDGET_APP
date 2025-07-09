####################
# Base Stage
####################
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs
WORKDIR /app

####################
# Frontend Builder Stage
####################
FROM base AS frontend-builder
WORKDIR /app

# Copier d'abord package.json et package-lock.json pour utiliser le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm ci && npm cache clean --force

# Copier tous les fichiers de configuration nécessaires
COPY tsconfig.json tsconfig.node.json ./
COPY vite.config.ts vitest.config.ts ./
COPY tailwind.config.js postcss.config.js ./
COPY index.html ./

# Copier les sources frontend
COPY src ./src

# Construire le frontend
ENV VITE_API_URL=/api/v1
RUN npm run build

####################
# Backend Dependencies Stage
####################
FROM base AS backend-deps
WORKDIR /app
# Copier les fichiers de dépendances du backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

####################
# Backend Builder Stage
####################
FROM base AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci && npm cache clean --force
COPY backend/. .
RUN npx prisma generate
RUN npm run build

####################
# Production Stage
####################
FROM base AS production
WORKDIR /app

# Copier les dépendances backend
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=backend-deps /app/prisma ./prisma

# Copier le build backend
COPY --from=backend-builder /app/dist ./dist

# Copier le build frontend dans le dossier public (IMPORTANT: Vite génère dans 'dist')
COPY --from=frontend-builder /app/dist ./public

# Copier package.json pour les scripts npm
COPY --from=backend-builder /app/package.json ./

# Scripts d'initialisation
COPY backend/healthcheck.js ./

# USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Commande directe sans script externe
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
