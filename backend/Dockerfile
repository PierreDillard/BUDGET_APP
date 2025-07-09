####################
# Base Stage
####################
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs
WORKDIR /app

####################
# Dependencies Stage
####################
FROM base AS deps
# Copier seulement les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

####################
# Builder Stage
####################
FROM base AS builder
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

# Copier seulement les dépendances de production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Copier package.json pour les scripts npm
COPY package.json ./

# Scripts d'initialisation
COPY healthcheck.js init.sh ./

# Changer les permissions AVANT de switcher d'utilisateur
RUN chmod +x init.sh && \
    chown nestjs:nodejs init.sh healthcheck.js && \
    chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["./init.sh"]