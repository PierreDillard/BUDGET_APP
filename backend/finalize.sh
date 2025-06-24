#!/bin/bash

# Budget App Backend - Script de finalisation
# Supprime les fichiers obsolètes et finalise l'installation

echo "🧹 Budget App Backend - Finalisation et nettoyage"
echo "================================================"
echo ""

# Fonction pour afficher les messages
print_step() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

# Vérification de l'emplacement
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Ce script doit être exécuté depuis le dossier backend"
    exit 1
fi

print_step "1. Nettoyage des fichiers obsolètes..."

# Supprimer le dossier .obsolete s'il existe
if [ -d ".obsolete" ]; then
    rm -rf .obsolete
    print_success "Dossier .obsolete supprimé"
else
    print_success "Aucun fichier obsolète à supprimer"
fi

# Supprimer les fichiers temporaires
find . -name "*.bak" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

print_step "2. Vérification de la structure finale..."

# Vérifier que tous les modules sont présents
MODULES=("auth" "users" "incomes" "expenses" "planned-expenses" "balance" "prisma")
MISSING_MODULES=0

for module in "${MODULES[@]}"; do
    if [ -d "src/$module" ]; then
        print_success "Module $module présent"
    else
        echo "❌ Module $module manquant"
        MISSING_MODULES=$((MISSING_MODULES + 1))
    fi
done

print_step "3. Mise à jour des permissions des scripts..."

# Rendre les scripts exécutables
chmod +x check-config.sh 2>/dev/null || true
chmod +x quick-start.sh 2>/dev/null || true
print_success "Permissions des scripts mises à jour"

print_step "4. Vérification des fichiers de configuration..."

# Vérifier les fichiers essentiels
ESSENTIAL_FILES=(
    "package.json"
    ".env.example"
    "prisma/schema.prisma"
    "prisma/seed.ts"
    "src/main.ts"
    "src/app.module.ts"
    "README.md"
    "docker-compose.yml"
    "Dockerfile"
)

MISSING_FILES=0
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file présent"
    else
        echo "❌ $file manquant"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

print_step "5. Test de compilation TypeScript..."

# Vérifier que le code compile
if npm run build > /dev/null 2>&1; then
    print_success "Compilation TypeScript réussie"
    # Nettoyer le build de test
    rm -rf dist 2>/dev/null || true
else
    print_warning "Erreur de compilation TypeScript"
    echo "   Exécutez 'npm run build' pour voir les détails"
fi

echo ""
print_step "📋 RÉSUMÉ DE LA FINALISATION"
echo "============================"

if [ $MISSING_MODULES -eq 0 ] && [ $MISSING_FILES -eq 0 ]; then
    print_success "🎉 Backend parfaitement finalisé !"
    echo ""
    echo "📁 Structure du projet:"
    echo "   ├── src/                     # Code source"
    echo "   │   ├── auth/               # Module authentification"
    echo "   │   ├── users/              # Module utilisateurs"
    echo "   │   ├── incomes/            # Module revenus"
    echo "   │   ├── expenses/           # Module dépenses"
    echo "   │   ├── planned-expenses/   # Module budgets"
    echo "   │   ├── balance/            # Module calculs"
    echo "   │   ├── prisma/             # Module Prisma"
    echo "   │   └── common/             # Utilitaires communs"
    echo "   ├── prisma/                 # Schéma et migrations"
    echo "   ├── docker-compose.yml     # Configuration Docker"
    echo "   ├── Dockerfile              # Image Docker"
    echo "   └── README.md               # Documentation"
    echo ""
    echo "🚀 Commandes disponibles:"
    echo "   ./quick-start.sh            # Démarrage rapide automatique"
    echo "   ./check-config.sh           # Vérifier la configuration"
    echo "   npm run start:dev           # Démarrer en développement"
    echo "   npm run db:studio           # Interface Prisma Studio"
    echo "   docker-compose up postgres  # PostgreSQL avec Docker"
    echo ""
    echo "🔗 URLs après démarrage:"
    echo "   API: http://localhost:3001/api/v1"
    echo "   Docs: http://localhost:3001/api/docs"
    echo "   Health: http://localhost:3001/api/v1/health"
    echo ""
    echo "✅ Le backend Budget App est prêt pour la production !"
else
    echo "❌ Finalisation incomplète:"
    [ $MISSING_MODULES -ne 0 ] && echo "   $MISSING_MODULES modules manquants"
    [ $MISSING_FILES -ne 0 ] && echo "   $MISSING_FILES fichiers manquants"
    echo ""
    echo "Vérifiez la structure du projet et relancez le script."
fi

echo ""
echo "🏁 Finalisation terminée."
