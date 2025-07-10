#!/bin/bash
# filepath: deploy.sh

set -e

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

# Charger les variables d'environnement
echo "📋 Loading environment variables from $ENV_FILE..."
set -a  # Exporter automatiquement toutes les variables
source "$ENV_FILE"
set +a

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master

# Backup only if containers are already running
if [ "$ENV" = "production" ]; then
  echo "📦 Checking for existing database..."
  if docker compose -f $COMPOSE_FILE ps postgres 2>/dev/null | grep -q "Up"; then
    echo "Creating database backup..."
    docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "backup-$(date +%Y%m%d-%H%M%S).sql" || echo "Backup failed, continuing..."
  else
    echo "No running database found, skipping backup"
  fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f $COMPOSE_FILE down

# Remove old images to force rebuild
echo "🗑️ Removing old app images..."
docker rmi budget-app-app budget-app-frontend 2>/dev/null || true

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build

# Wait for PostgreSQL to be ready first
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=120
while [ $timeout -gt 0 ]; do
  if docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB 2>/dev/null; then
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
app_timeout=60
while [ $app_timeout -gt 0 ]; do
  if docker compose -f $COMPOSE_FILE exec -T app node healthcheck.js 2>/dev/null; then
    echo "✅ Application is healthy!"
    break
  fi
  echo "Waiting for application... ($app_timeout seconds remaining)"
  sleep 5
  app_timeout=$((app_timeout - 5))
done

if [ $app_timeout -le 0 ]; then
  echo "⚠️ Application health check timed out, checking logs..."
  docker compose -f $COMPOSE_FILE logs --tail=50 app
fi

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f $COMPOSE_FILE ps

# Test health endpoint
echo "🧪 Testing application health..."
if curl -f http://localhost:${APP_PORT:-3001}/api/v1/health >/dev/null 2>&1; then
  echo "✅ Application health endpoint is responding!"
else
  echo "⚠️ Application health endpoint check failed"
fi

# Clean up
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment completed!"
echo "🌐 Application should be available at: http://localhost:${APP_PORT:-80}"
echo ""
echo "📊 Quick status check:"
docker compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"