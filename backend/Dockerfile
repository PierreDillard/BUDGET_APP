####################
# Base Stage
####################
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nestjs
WORKDIR /app
# Copier seulement package*.json et prisma pour utiliser le cache Docker
COPY package*.json ./
COPY prisma ./prisma/

####################
# Builder Stage
####################
FROM base AS builder
RUN npm install && npm cache clean --force
COPY . .
RUN npx prisma generate
RUN npm run build

####################
# Production Stage
####################
FROM base AS production
WORKDIR /app
# On récupère modules et build depuis builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/prisma      ./prisma

# On ajoute init + healthcheck
COPY healthcheck.js init.sh ./
RUN chmod +x init.sh

USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["./init.sh"]
