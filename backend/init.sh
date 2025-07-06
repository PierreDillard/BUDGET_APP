#!/bin/bash

# Script d'initialisation pour l'application Budget
# Ce script s'exécute au démarrage du conteneur

echo "🚀 Initialisation de l'application Budget..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
until npx prisma db push --accept-data-loss > /dev/null 2>&1; do
  echo "⏳ Base de données non disponible, nouvelle tentative dans 2 secondes..."
  sleep 2
done

echo "✅ Base de données connectée!"

# Exécuter les migrations Prisma
echo "🔄 Exécution des migrations Prisma..."
npx prisma migrate deploy

# Générer le client Prisma (au cas où)
echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "✅ Initialisation terminée!"

# Lancer l'application
echo "🚀 Démarrage de l'application..."
exec npm run start:prod
