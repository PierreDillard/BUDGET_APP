#!/bin/bash

# Script pour nettoyer complètement l'environnement Docker

echo "🧹 Nettoyage complet de l'environnement Docker..."

cd "$(dirname "$0")"

# Arrêter tous les conteneurs
echo "🛑 Arrêt des conteneurs..."
docker-compose down

# Supprimer les volumes (données)
echo "🗑️  Suppression des volumes de données..."
docker volume rm budget_postgres_data 2>/dev/null || true
docker volume rm budget_redis_data 2>/dev/null || true
docker volume rm backend_postgres_data 2>/dev/null || true

# Supprimer les images (optionnel)
read -p "Supprimer aussi les images Docker ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Suppression des images..."
    docker rmi postgres:15-alpine 2>/dev/null || true
    docker rmi redis:7-alpine 2>/dev/null || true
fi

# Nettoyer Docker
echo "🧽 Nettoyage Docker général..."
docker system prune -f

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "🚀 Pour redémarrer :"
echo "   ./start-docker.sh"
