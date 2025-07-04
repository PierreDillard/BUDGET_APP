# Budget App - Makefile for easy deployment and management

.PHONY: help build deploy deploy-staging deploy-prod status logs backup cleanup rollback dev test

# Default environment
ENV ?= production

# Help command
help: ## Show this help message
	@echo "🏗️ Budget App - Deployment Commands"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Development
dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	docker compose up -d postgres redis
	cd backend && npm run start:dev &
	npm run dev

test: ## Run tests
	@echo "🧪 Running tests..."
	npm run typecheck
	npm run lint
	cd backend && npm run test

##@ Building
build: ## Build the application
	@echo "🏗️ Building application..."
	docker build -t budget-app:latest .

build-prod: ## Build production Docker image
	@echo "🏗️ Building production image..."
	docker build -t budget-app:prod --target production .

##@ Deployment
deploy: ## Deploy to specified environment (ENV=production|staging)
	@echo "🚀 Deploying to $(ENV)..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh deploy $(ENV)

deploy-staging: ## Deploy to staging environment
	@$(MAKE) deploy ENV=staging

deploy-prod: ## Deploy to production environment
	@$(MAKE) deploy ENV=production

quick-deploy: ## Quick deploy (no backup, no cleanup)
	@echo "⚡ Quick deployment..."
	docker compose -f docker-compose.prod.yml --env-file .env.$(ENV) up -d --remove-orphans

##@ Management
status: ## Show deployment status
	@echo "📊 Deployment Status:"
	docker compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "🌐 Application URLs:"
	@echo "  Main App: http://localhost:3001"
	@echo "  Health:   http://localhost:3001/health"

logs: ## Show application logs
	docker compose -f docker-compose.prod.yml logs -f app

logs-all: ## Show all service logs
	docker compose -f docker-compose.prod.yml logs -f

backup: ## Create database backup
	@echo "💾 Creating database backup..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh backup

restore: ## Restore database from backup (BACKUP_FILE required)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Please specify BACKUP_FILE=path/to/backup.sql"; \
		exit 1; \
	fi
	@echo "🔄 Restoring database from $(BACKUP_FILE)..."
	docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d budget_app < $(BACKUP_FILE)

##@ Maintenance
cleanup: ## Clean up old Docker resources
	@echo "🧹 Cleaning up..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh cleanup

rollback: ## Rollback to previous version (TAG required)
	@if [ -z "$(TAG)" ]; then \
		echo "❌ Please specify TAG=version"; \
		exit 1; \
	fi
	@echo "🔄 Rolling back to $(TAG)..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh rollback $(ENV) $(TAG)

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	docker compose -f docker-compose.prod.yml down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker compose -f docker-compose.prod.yml restart

##@ Monitoring
health: ## Check application health
	@echo "🏥 Health Check:"
	@curl -f http://localhost:3001/health && echo "✅ Application is healthy" || echo "❌ Application is unhealthy"

monitor: ## Monitor application metrics
	@echo "📊 Application Metrics:"
	@curl -s http://localhost:3001/metrics 2>/dev/null || echo "Metrics endpoint not available"

shell-app: ## Access application container shell
	docker compose -f docker-compose.prod.yml exec app sh

shell-db: ## Access database container shell
	docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d budget_app

##@ Setup
init: ## Initialize the project for deployment
	@echo "🎯 Initializing project..."
	@if [ ! -f ".env.production" ]; then \
		cp .env.prod.template .env.production; \
		echo "📝 Created .env.production from template"; \
		echo "⚠️  Please configure .env.production with your values"; \
	fi
	@if [ ! -f ".env.staging" ]; then \
		cp .env.prod.template .env.staging; \
		echo "📝 Created .env.staging from template"; \
		echo "⚠️  Please configure .env.staging with your values"; \
	fi
	@mkdir -p backups logs nginx/ssl
	@chmod +x scripts/*.sh
	@echo "✅ Project initialized successfully!"

update-deps: ## Update all dependencies
	@echo "📦 Updating dependencies..."
	npm update
	cd backend && npm update

##@ Security
security-scan: ## Run security audit
	@echo "🔒 Running security scan..."
	npm audit
	cd backend && npm audit

ssl-setup: ## Setup SSL certificates (requires manual configuration)
	@echo "🔐 SSL Setup Guide:"
	@echo "1. Place your SSL certificate as nginx/ssl/cert.pem"
	@echo "2. Place your SSL private key as nginx/ssl/key.pem"
	@echo "3. Update nginx/nginx.conf to enable SSL configuration"
	@echo "4. Update docker-compose.prod.yml to enable nginx profile"

##@ CI/CD
ci-build: ## Build for CI environment
	@echo "🤖 CI Build..."
	npm ci
	npm run build
	cd backend && npm ci && npm run build

ci-test: ## Run CI tests
	@echo "🤖 CI Tests..."
	npm run typecheck
	npm run lint
	cd backend && npm run test && npm run test:e2e

# Default target
.DEFAULT_GOAL := help
