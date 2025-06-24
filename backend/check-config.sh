#!/bin/bash

# Budget App Backend - Configuration Check Script
# Ce script vérifie que le backend est correctement configuré

echo "🔍 Budget App Backend - Vérification de configuration"
echo "=================================================="
echo ""

# Vérification Node.js
echo "📦 Vérification de Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installé: $NODE_VERSION"
    
    # Vérifier version minimale (18+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo "✅ Version Node.js compatible (18+)"
    else
        echo "❌ Version Node.js trop ancienne. Minimum requis: 18+"
        exit 1
    fi
else
    echo "❌ Node.js non installé"
    exit 1
fi

echo ""

# Vérification npm
echo "📦 Vérification de npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installé: $NPM_VERSION"
else
    echo "❌ npm non installé"
    exit 1
fi

echo ""

# Vérification des dépendances
echo "📦 Vérification des dépendances..."
if [ -f "package.json" ]; then
    echo "✅ package.json trouvé"
    
    if [ -d "node_modules" ]; then
        echo "✅ node_modules trouvé"
    else
        echo "⚠️  node_modules manquant. Exécutez: npm install"
    fi
else
    echo "❌ package.json non trouvé"
    exit 1
fi

echo ""

# Vérification de l'environnement
echo "🔧 Vérification de la configuration..."
if [ -f ".env" ]; then
    echo "✅ Fichier .env trouvé"
    
    # Vérifier les variables essentielles
    if grep -q "DATABASE_URL" .env; then
        echo "✅ DATABASE_URL configuré"
    else
        echo "❌ DATABASE_URL manquant dans .env"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        echo "✅ JWT_SECRET configuré"
    else
        echo "❌ JWT_SECRET manquant dans .env"
    fi
    
    if grep -q "JWT_REFRESH_SECRET" .env; then
        echo "✅ JWT_REFRESH_SECRET configuré"
    else
        echo "❌ JWT_REFRESH_SECRET manquant dans .env"
    fi
    
else
    echo "⚠️  Fichier .env manquant. Copiez .env.example vers .env"
fi

echo ""

# Vérification PostgreSQL
echo "🗄️  Vérification de PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ Client PostgreSQL installé"
else
    echo "⚠️  Client PostgreSQL non trouvé (optionnel)"
fi

# Tentative de connexion à la base de données
if [ -f ".env" ]; then
    DATABASE_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2 | tr -d '"')
    if [ ! -z "$DATABASE_URL" ]; then
        echo "🔍 Test de connexion à la base de données..."
        if command -v psql &> /dev/null; then
            if timeout 5 psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
                echo "✅ Connexion à la base de données réussie"
            else
                echo "❌ Impossible de se connecter à la base de données"
                echo "   Vérifiez que PostgreSQL est démarré et que les paramètres sont corrects"
            fi
        fi
    fi
fi

echo ""

# Vérification Prisma
echo "🔧 Vérification de Prisma..."
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Schema Prisma trouvé"
else
    echo "❌ Schema Prisma manquant"
fi

# Vérifier si le client Prisma est généré
if [ -d "node_modules/.prisma" ]; then
    echo "✅ Client Prisma généré"
else
    echo "⚠️  Client Prisma non généré. Exécutez: npx prisma generate"
fi

echo ""

# Vérification de la structure des fichiers
echo "📁 Vérification de la structure du projet..."
REQUIRED_FILES=(
    "src/main.ts"
    "src/app.module.ts"
    "src/auth/auth.module.ts"
    "src/users/users.module.ts"
    "src/incomes/incomes.module.ts"
    "src/expenses/expenses.module.ts"
    "src/planned-expenses/planned-expenses.module.ts"
    "src/balance/balance.module.ts"
    "src/prisma/prisma.module.ts"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""

# Résumé final
echo "📋 RÉSUMÉ DE LA VÉRIFICATION"
echo "============================"
if [ $MISSING_FILES -eq 0 ]; then
    echo "🎉 Configuration complète et correcte !"
    echo ""
    echo "🚀 Commandes pour démarrer :"
    echo "   npm run db:generate     # Générer le client Prisma"
    echo "   npm run db:migrate      # Créer les tables"
    echo "   npm run db:seed         # Données de démonstration"
    echo "   npm run start:dev       # Démarrer en mode développement"
    echo ""
    echo "🔗 Une fois démarré :"
    echo "   API: http://localhost:3001/api/v1"
    echo "   Docs: http://localhost:3001/api/docs"
else
    echo "❌ Configuration incomplète ($MISSING_FILES fichiers manquants)"
    echo "   Vérifiez l'installation et la structure du projet"
fi

echo ""
echo "🔍 Vérification terminée."
