####################
# Base Stage
####################
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs
WORKDIR /app

####################
# Dependencies Stage
####################
FROM base AS deps
# Contexte racine: copier depuis backend/prisma
WORKDIR /app
COPY package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci && npm cache clean --force
RUN npx prisma generate

####################
# Builder Stage
####################
FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci && npm cache clean --force
COPY . .
RUN npx prisma generate
RUN npm run build

####################
# Production Stage
####################
FROM node:18-alpine AS production
# Reprendre base plutôt que node pour user & libs
RUN apk add --no-cache libc6-compat openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs
WORKDIR /app

# Copier les dépendances et Prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copier le build backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copier le script healthcheck depuis backend
COPY backend/healthcheck.js ./healthcheck.js

RUN chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
