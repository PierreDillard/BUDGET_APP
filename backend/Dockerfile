####################
# Base Stage
####################
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs
WORKDIR /app

####################
# Frontend Dependencies Stage
####################
FROM base AS frontend-deps
WORKDIR /app/frontend
COPY ../package*.json ./
RUN npm ci && npm cache clean --force

####################
# Frontend Builder Stage
####################
FROM frontend-deps AS frontend-builder
WORKDIR /app/frontend
COPY ../src ./src
COPY ../public ./public
COPY ../index.html ./
COPY ../vite.config.ts ./
COPY ../tsconfig.json ./
COPY ../tsconfig.node.json ./
COPY ../tailwind.config.js ./
COPY ../postcss.config.js ./
RUN npm run build

####################
# Backend Dependencies Stage
####################
FROM base AS backend-deps
WORKDIR /app
# Copier seulement les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

####################
# Backend Builder Stage
####################
FROM base AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npm cache clean --force
COPY . .
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

# Copier le build frontend dans le dossier public
COPY --from=frontend-builder /app/frontend/dist ./public

# Copier package.json pour les scripts npm
COPY package.json ./

# Scripts d'initialisation
COPY healthcheck.js ./

# Rester en root temporairement pour debug
# USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Commande directe sans script externe
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
