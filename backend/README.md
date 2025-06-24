# Budget App Backend API ✅ FINALISÉ

API REST complète pour l'application de gestion de budget personnel, développée avec NestJS, Prisma, et PostgreSQL.

## 🚀 Technologies utilisées

- **NestJS 10** - Framework Node.js progressif avec TypeScript
- **Prisma 5** - ORM moderne pour PostgreSQL  
- **PostgreSQL 13+** - Base de données relationnelle
- **JWT** - Authentification avec access/refresh tokens
- **Passport** - Stratégies d'authentification (Local + JWT)
- **Swagger/OpenAPI** - Documentation API automatique
- **bcryptjs** - Hachage sécurisé des mots de passe
- **class-validator/transformer** - Validation et transformation des données
- **helmet** - Sécurité des en-têtes HTTP
- **CORS** - Configuration cross-origin
- **Rate limiting** - Protection contre les attaques

## 📋 Fonctionnalités implémentées

### ✅ Authentification complète
- Inscription et connexion utilisateur
- JWT avec access tokens (15min) et refresh tokens (7j)
- Rotation automatique des refresh tokens
- Logout sécurisé (suppression des tokens)
- Nettoyage automatique des tokens expirés
- Protection des routes avec guards

### ✅ Gestion des utilisateurs
- Profil utilisateur personnalisable
- Paramètres : devise (EUR/USD/GBP), jour de début du mois, marge de sécurité
- Préférences de notifications
- CRUD complet avec validation

### ✅ CRUD Revenus récurrents  
- Création, lecture, modification, suppression
- Catégorisation (salaire, freelance, investissement, etc.)
- Jour du mois de versement configurable
- Calcul automatique du total mensuel
- Statistiques par catégorie

### ✅ CRUD Dépenses récurrentes
- Création, lecture, modification, suppression  
- Catégorisation (loyer, factures, transport, etc.)
- Jour du mois d'échéance
- Dépenses à venir et en retard
- Statistiques détaillées

### ✅ CRUD Budgets ponctuels
- Planification de dépenses exceptionnelles
- Dates spécifiques et catégories
- Marquage comme "dépensé"
- Budgets en retard et à venir
- Projections et statistiques

### ✅ Calculs financiers avancés
- Solde actuel avec marge de sécurité
- Projections de solde sur 30 jours
- Alertes intelligentes
- Tendances mensuelles
- Récapitulatif complet

## 🛠️ Installation et démarrage rapide

### Prérequis
- **Node.js 18+** 
- **PostgreSQL 13+**
- **npm** ou **yarn**

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
nano .env
```

**Configuration minimale dans `.env` :**
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5432/budget_app_dev?schema=public"

# Secrets JWT (CHANGEZ EN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-256-bits"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-256-bits"

# Configuration serveur
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 3. Configuration de la base de données PostgreSQL

**Option A : Installation locale PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS avec Homebrew
brew install postgresql
brew services start postgresql

# Créer l'utilisateur et la base de données
sudo -u postgres psql
```

**Commandes SQL :**
```sql
-- Dans psql
CREATE USER budget_user WITH PASSWORD 'budget_password';
CREATE DATABASE budget_app_dev OWNER budget_user;
GRANT ALL PRIVILEGES ON DATABASE budget_app_dev TO budget_user;
\q
```

**Option B : Docker PostgreSQL** 
```bash
docker run --name budget-postgres \
  -e POSTGRES_DB=budget_app_dev \
  -e POSTGRES_USER=budget_user \
  -e POSTGRES_PASSWORD=budget_password \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configuration Prisma et migrations

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations (créer les tables)
npx prisma migrate dev --name init

# (Optionnel) Remplir avec des données de test
npm run db:seed
```

### 5. Démarrage du serveur

```bash
# Mode développement avec hot-reload
npm run start:dev

# L'API sera disponible sur http://localhost:3001
```

## 🎯 Accès rapide

Une fois démarré, vous pouvez accéder à :

- **API** : http://localhost:3001/api/v1
- **Documentation Swagger** : http://localhost:3001/api/docs  
- **Health Check** : http://localhost:3001/api/v1/health
- **Prisma Studio** : `npm run db:studio` puis http://localhost:5555

## 📚 Documentation API

### Endpoints principaux

#### 🔐 Authentification
```
POST /api/v1/auth/register      # Inscription
POST /api/v1/auth/login         # Connexion  
POST /api/v1/auth/refresh       # Rafraîchir tokens
POST /api/v1/auth/logout        # Déconnexion
GET  /api/v1/auth/me            # Profil utilisateur
```

#### 👤 Utilisateurs
```
GET    /api/v1/users/me         # Profil utilisateur
PATCH  /api/v1/users/me         # Modifier profil
DELETE /api/v1/users/me         # Supprimer compte
```

#### 💰 Revenus récurrents
```
GET    /api/v1/incomes          # Lister revenus
POST   /api/v1/incomes          # Créer revenu
GET    /api/v1/incomes/:id      # Détails revenu
PATCH  /api/v1/incomes/:id      # Modifier revenu
DELETE /api/v1/incomes/:id      # Supprimer revenu
GET    /api/v1/incomes/total    # Total mensuel
GET    /api/v1/incomes/by-category # Par catégorie
```

#### 💸 Dépenses récurrentes
```
GET    /api/v1/expenses         # Lister dépenses
POST   /api/v1/expenses         # Créer dépense
GET    /api/v1/expenses/:id     # Détails dépense
PATCH  /api/v1/expenses/:id     # Modifier dépense
DELETE /api/v1/expenses/:id     # Supprimer dépense
GET    /api/v1/expenses/total   # Total mensuel
GET    /api/v1/expenses/upcoming # Dépenses à venir
```

#### 🎯 Budgets ponctuels
```
GET    /api/v1/planned          # Lister budgets
POST   /api/v1/planned          # Créer budget
GET    /api/v1/planned/:id      # Détails budget
PATCH  /api/v1/planned/:id      # Modifier budget
DELETE /api/v1/planned/:id      # Supprimer budget
PATCH  /api/v1/planned/:id/spent # Marquer dépensé
GET    /api/v1/planned/statistics # Statistiques
GET    /api/v1/planned/upcoming  # À venir
GET    /api/v1/planned/overdue   # En retard
```

#### 📊 Calculs de solde
```
GET /api/v1/balance              # Solde actuel
GET /api/v1/balance/projection   # Projection 30j
GET /api/v1/balance/alerts       # Alertes
GET /api/v1/balance/summary      # Récapitulatif
GET /api/v1/balance/trends       # Tendances
```

### 🔑 Authentification

La plupart des endpoints nécessitent un token JWT :

```bash
# Header requis
Authorization: Bearer <votre-access-token>
```

**Exemple avec curl :**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3001/api/v1/incomes
```

## 🗄️ Scripts disponibles

```bash
# 🚀 Développement
npm run start:dev          # Démarrage avec hot-reload
npm run start:debug        # Avec débuggeur Node.js

# 🏗️ Build et production  
npm run build              # Build de production
npm run start:prod         # Démarrer en production

# 🗃️ Base de données
npm run db:migrate          # Exécuter migrations
npm run db:generate         # Générer client Prisma  
npm run db:seed            # Données de démonstration
npm run db:studio          # Interface Prisma Studio
npm run db:reset           # Réinitialiser BDD

# 🧪 Tests et qualité
npm run test               # Tests unitaires
npm run test:e2e          # Tests end-to-end
npm run test:cov          # Couverture de code
npm run lint              # Linting ESLint
npm run format            # Formatage Prettier
```

## 🔒 Sécurité implémentée

- ✅ **Hachage bcrypt** des mots de passe (10 rounds)
- ✅ **JWT courts** (15min) + refresh tokens (7j) avec rotation
- ✅ **Rate limiting** (100 req/min par IP)
- ✅ **CORS** configuré pour le frontend
- ✅ **Helmet** pour sécuriser les en-têtes HTTP
- ✅ **Validation stricte** avec class-validator
- ✅ **Guards d'authentification** sur toutes les routes privées
- ✅ **Nettoyage automatique** des tokens expirés

## 🗂️ Architecture du projet

```
src/
├── app.module.ts           # Module principal
├── main.ts                 # Point d'entrée 
├── auth/                   # Module authentification
│   ├── auth.controller.ts
│   ├── auth.service.ts  
│   ├── auth.module.ts
│   ├── dto/                # DTOs d'auth
│   ├── guards/             # Guards JWT/Local
│   └── strategies/         # Strategies Passport
├── users/                  # Module utilisateurs
├── incomes/                # Module revenus
├── expenses/               # Module dépenses  
├── planned-expenses/       # Module budgets
├── balance/                # Module calculs
├── prisma/                 # Module Prisma
└── common/                 # Filtres, pipes, etc.
```

## 🚨 Dépannage courant

**❌ Erreur de connexion PostgreSQL :**
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Tester la connexion manuelle
psql "postgresql://budget_user:budget_password@localhost:5432/budget_app_dev"
```

**❌ Erreurs de migration Prisma :**
```bash
# Réinitialiser complètement
npm run db:reset

# Régénérer le client
npx prisma generate
```

**❌ Port 3001 déjà utilisé :**
```bash
# Changer le port dans .env
PORT=3002

# Ou tuer le processus
sudo lsof -ti:3001 | xargs kill -9
```

**❌ Erreur JWT_SECRET :**
```bash
# Générer des secrets forts
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Déploiement production

### Variables d'environnement PROD
```env
DATABASE_URL="postgresql://user:pass@host:5432/budget_app_prod"
JWT_SECRET="generated-256-bit-secret"
JWT_REFRESH_SECRET="another-256-bit-secret" 
NODE_ENV=production
PORT=3001
FRONTEND_URL="https://budget.mondomaine.com"
```

### Docker 
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

## ✅ Backend Status : TERMINÉ

Le backend Budget App est **complètement finalisé** avec :

- ✅ **Architecture NestJS propre** (modules, services, controllers)
- ✅ **Authentification JWT sécurisée** avec refresh tokens
- ✅ **CRUD complet** pour toutes les entités (User, Income, Expense, PlannedExpense)
- ✅ **Calculs financiers avancés** (solde, projections, alertes)
- ✅ **API REST documentée** avec Swagger/OpenAPI
- ✅ **Sécurité renforcée** (helmet, CORS, rate limiting, validation)
- ✅ **Base de données Prisma** avec migrations
- ✅ **Tests unitaires** et intégration
- ✅ **Architecture extensible** et maintenable

### 🎯 Prêt pour la production !

**Démarrage en une commande :**
```bash
npm run start:dev
```

**Accès direct :**
- 🔗 API : http://localhost:3001/api/v1
- 📚 Docs : http://localhost:3001/api/docs

---

**L'API Budget App est opérationnelle ! 🎉**
