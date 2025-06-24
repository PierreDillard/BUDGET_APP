# Budget App Backend Dockerfile
FROM node:18-alpine AS base

# Installer les dépendances système
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Builder stage
FROM base AS builder
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Builder l'application
RUN npm run build

# Production stage
FROM base AS production

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copier les fichiers de configuration
COPY package*.json ./

# Changer l'utilisateur
USER nestjs

# Exposer le port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Commande de démarrage
CMD ["npm", "run", "start:prod"]
