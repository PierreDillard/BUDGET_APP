#!/bin/bash

# Budget App Backend - Script de démarrage rapide
# Ce script configure et démarre rapidement le backend

set -e

echo "🚀 Budget App Backend - Démarrage rapide"
echo "========================================"
echo ""

# Fonction pour afficher les messages colorés
print_step() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

# Vérification des prérequis
print_step "1. Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ requis. Version actuelle: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) installé"

# Installation des dépendances
print_step "2. Installation des dépendances..."
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dépendances installées"
else
    print_success "Dépendances déjà installées"
fi

# Configuration de l'environnement
print_step "3. Configuration de l'environnement..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_warning "Fichier .env créé depuis .env.example"
    print_warning "⚠️  Modifiez .env avec vos paramètres de base de données"
    
    # Génération automatique des secrets JWT
    JWT_SECRET=$(node -p "require('crypto').randomBytes(64).toString('hex')")
    JWT_REFRESH_SECRET=$(node -p "require('crypto').randomBytes(64).toString('hex')")
    
    # Remplacer les secrets dans .env
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
    sed -i.bak "s/your-super-secret-refresh-key-change-in-production/$JWT_REFRESH_SECRET/" .env
    rm .env.bak
    
    print_success "Secrets JWT générés automatiquement"
else
    print_success "Fichier .env existe déjà"
fi

# Configuration de la base de données
print_step "4. Configuration de la base de données..."

# Vérifier si Docker est disponible
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker détecté. Voulez-vous utiliser Docker pour PostgreSQL ? (y/n)"
    read -p "Réponse: " USE_DOCKER
    
    if [ "$USE_DOCKER" = "y" ] || [ "$USE_DOCKER" = "Y" ]; then
        print_step "   Démarrage de PostgreSQL avec Docker..."
        docker-compose up -d postgres
        
        # Attendre que PostgreSQL soit prêt
        echo "   Attente de PostgreSQL..."
        sleep 10
        
        # Vérifier si PostgreSQL est prêt
        for i in {1..30}; do
            if docker-compose exec postgres pg_isready -U budget_user -d budget_app_dev &> /dev/null; then
                print_success "PostgreSQL prêt"
                break
            fi
            echo "   Tentative $i/30..."
            sleep 2
        done
    fi
else
    print_warning "Docker non disponible. Assurez-vous que PostgreSQL est installé et configuré"
fi

# Génération du client Prisma
print_step "5. Génération du client Prisma..."
npx prisma generate
print_success "Client Prisma généré"

# Exécution des migrations
print_step "6. Exécution des migrations..."
if npx prisma migrate deploy &> /dev/null; then
    print_success "Migrations appliquées"
else
    print_warning "Erreur lors des migrations. Tentative avec migrate dev..."
    if npx prisma migrate dev --name init &> /dev/null; then
        print_success "Migrations dev appliquées"
    else
        print_error "Impossible d'appliquer les migrations"
        print_warning "Vérifiez la configuration de votre base de données dans .env"
    fi
fi

# Données de démonstration
print_step "7. Insertion des données de démonstration..."
echo "Voulez-vous insérer des données de démonstration ? (y/n)"
read -p "Réponse: " SEED_DATA

if [ "$SEED_DATA" = "y" ] || [ "$SEED_DATA" = "Y" ]; then
    npm run db:seed
    print_success "Données de démonstration insérées"
    echo ""
    echo "🎯 Identifiants de démonstration:"
    echo "   Email: demo@budgetapp.com"
    echo "   Mot de passe: demo123"
fi

echo ""
print_step "8. Démarrage de l'application..."

# Vérification finale
print_success "Configuration terminée avec succès !"
echo ""
echo "🔗 URLs utiles:"
echo "   API: http://localhost:3001/api/v1"
echo "   Documentation: http://localhost:3001/api/docs"
echo "   Health check: http://localhost:3001/api/v1/health"
echo ""
echo "🚀 Démarrage en cours..."

# Démarrer l'application
npm run start:dev
