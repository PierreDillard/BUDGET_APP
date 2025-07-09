####################
# Production Stage
####################
FROM base AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Copier le frontend build depuis la racine du projet
COPY --from=builder /app/../dist ./dist/public

# Copier package.json pour les scripts npm
COPY package.json ./

# Scripts d'initialisation
COPY healthcheck.js ./

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]