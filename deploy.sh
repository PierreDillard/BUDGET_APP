#!/bin/bash

# Simple deployment script for Budget App
# Usage: ./deploy.sh [production|dev]

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

if [ "$ENV" = "dev" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
fi

echo "🚀 Deploying Budget App to $ENV environment..."

# Pull latest changes
git pull origin main

# Make a quick database backup if in production
if [ "$ENV" = "production" ]; then
  echo "📦 Creating database backup..."
  docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres budget_app > "backup-$(date +%Y%m%d-%H%M%S).sql"
fi

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose -f $COMPOSE_FILE up -d --build

# Clean up
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment completed!"
