#!/bin/bash

# Simple deployment script for Budget App
# Usage: ./deploy.sh [production|dev]

set -e  # Exit on any error

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

if [ "$ENV" = "dev" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
  ENV_FILE=".env"
fi

echo "🚀 Deploying Budget App to $ENV environment..."

# Vérifier que le fichier d'environnement existe
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file $ENV_FILE not found!"
  exit 1
fi

# Pull latest changes (ajuster la branche si nécessaire)
echo "📥 Pulling latest changes..."
git pull origin master  # ou main selon votre repo

# Make a quick database backup if in production
if [ "$ENV" = "production" ]; then
  echo "📦 Creating database backup..."
  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec postgres pg_dump -U postgres budget_app > "backup-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || echo "No existing database to backup"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

# Clean up
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment completed!"
echo "🌐 Application should be available at: http://localhost:${APP_PORT:-3001}"
