#!/bin/bash
# filepath: deploy.sh

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

if [ "$ENV" = "dev" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
fi

echo "🚀 Deploying Budget App to $ENV environment..."

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
  echo "❌ Environment file .env not found!"
  exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master
# Juste après git pull
NEW_CHECKSUM=$(sha256sum "$0")
git pull origin master
UPDATED_CHECKSUM=$(sha256sum "$0")

if [ "$NEW_CHECKSUM" != "$UPDATED_CHECKSUM" ]; then
  echo "🔁 Script mis à jour, relancement..."
  exec "$0" "$@"
fi

# Backup only if containers are already running
if [ "$ENV" = "production" ]; then
  echo "📦 Checking for existing database..."
  if docker compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    echo "Creating database backup..."
    docker compose -f $COMPOSE_FILE exec postgres pg_dump -U postgres budget_app > "backup-$(date +%Y%m%d-%H%M%S).sql" || echo "Backup failed, continuing..."
  else
    echo "No running database found, skipping backup"
  fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f $COMPOSE_FILE down

# Remove old images to force rebuild
echo "🗑️ Removing old app image..."
docker rmi budget-app_app 2>/dev/null || true

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose -f $COMPOSE_FILE up -d --build

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=120
while [ $timeout -gt 0 ]; do
  if docker compose -f $COMPOSE_FILE exec postgres pg_isready -U postgres; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "Waiting for PostgreSQL... ($timeout seconds remaining)"
  sleep 5
  timeout=$((timeout - 5))
done

if [ $timeout -le 0 ]; then
  echo "❌ PostgreSQL failed to start in time"
  docker compose -f $COMPOSE_FILE logs postgres
  exit 1
fi

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 60

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f $COMPOSE_FILE ps

# Test health endpoint
echo "🧪 Testing application health..."
if curl -f http://localhost:${APP_PORT:-3001} >/dev/null 2>&1; then
  echo "✅ Application is healthy!"
else
  echo "⚠️ Application health check failed, checking logs..."
  docker compose -f $COMPOSE_FILE logs app
fi

# Clean up
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment completed!"
