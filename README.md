# Budget App - Version 2.0.0

## ✨ NOUVELLES FONCTIONNALITÉS v2.0

### 🔐 Authentification complète
- **Backend NestJS** avec base de données PostgreSQL
- **Authentification JWT** avec refresh tokens sécurisés
- **Gestion des sessions** et déconnexion automatique
- **Protection des données** utilisateur individuelles

### 💰 Ajustement manuel du solde
- **Modification directe du solde** sans affecter les revenus/dépenses récurrents
- **Historique des ajustements** avec description et types
- **Types d'ajustements** : manuel, correction, réinitialisation mensuelle
- **Interface intuitive** pour augmenter ou diminuer le solde

### 🔄 Réinitialisation mensuelle automatique
- **Application des revenus/dépenses récurrents** à chaque début de mois
- **Configuration du jour de début** du mois budgétaire (1-28)
- **Suivi du statut** de réinitialisation avec alertes
- **Historique complet** des réinitialisations précédentes

### 📊 Calculs avancés
- **Projections améliorées** avec prise en compte des ajustements
- **Alertes intelligentes** pour solde négatif et réinitialisation due
- **Marge de sécurité configurable** (0-50%)
- **Statistiques détaillées** par catégorie

---

## 🚀 Technologies utilisées

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Zustand** pour la gestion d'état
- **API Integration** avec gestion d'erreurs et retry
- **PWA Support** pour installation mobile

### Backend
- **NestJS** avec architecture modulaire
- **Prisma ORM** + PostgreSQL
- **JWT Authentication** avec refresh tokens
- **Swagger Documentation** automatique
- **Docker Support** pour déploiement

---

## 📱 Fonctionnalités

### 🔑 Authentification
- **Inscription/Connexion** avec validation
- **Gestion de session** sécurisée
- **Tokens JWT** avec rotation automatique
- **Déconnexion** avec nettoyage des données

### 💼 Gestion financière
- **Revenus récurrents** avec jour du mois configurable
- **Dépenses récurrentes** avec catégories
- **Budgets ponctuels** avec dates spécifiques
- **Ajustements manuels** du solde avec historique

### 📊 Tableaux de bord
- **Dashboard interactif** avec graphiques de projection
- **Alertes en temps réel** pour problèmes de budget
- **Historique des transactions** et ajustements
- **Statistiques détaillées** par catégorie

### ⚙️ Paramètres avancés
- **Devise configurable** (€, $, £)
- **Jour de début du mois** personnalisable
- **Marge de sécurité** ajustable
- **Notifications** activables/désactivables
- **Catégories personnalisées** pour organisation

---

## 🛠️ Installation et développement

### Prérequis
- **Node.js 18+** 
- **PostgreSQL 15+**
- **npm** ou **yarn**

### Installation complète

```bash
# Cloner le projet
cd APP_BUDGET

# 1. Installation du backend
cd backend

# Copier la configuration d'environnement
cp .env.example .env

# Éditer .env avec vos paramètres :
# DATABASE_URL="postgresql://username:password@localhost:5432/budget_app"
# JWT_SECRET="your-super-secret-jwt-key"
# JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Installer les dépendances
npm install

# Démarrer PostgreSQL avec Docker (optionnel)
docker-compose up postgres -d

# Appliquer les migrations de base de données
npx prisma migrate deploy
npx prisma generate

# Optionnel : Ajouter des données de démonstration
npx prisma db seed

# Démarrer le serveur backend
npm run start:dev
# Backend disponible sur http://localhost:3001

# 2. Installation du frontend (nouveau terminal)
cd ../

# Installer les dépendances
npm install

# Démarrer le serveur frontend
npm run dev
# Frontend disponible sur http://localhost:5173
```

### Scripts disponibles

#### Backend
```bash
cd backend

npm run start:dev          # Serveur de développement avec hot-reload
npm run start:prod         # Serveur de production
npm run build              # Build pour production
npm run test               # Tests unitaires
npm run test:e2e           # Tests end-to-end
npm run db:studio          # Interface Prisma Studio
npm run db:migrate         # Créer et appliquer une migration
npm run db:seed            # Ajouter des données de test
./quick-start.sh           # Script de démarrage automatique
```

#### Frontend
```bash
npm run dev                # Serveur de développement
npm run build              # Build de production
npm run preview            # Prévisualisation du build
npm run lint               # Linting du code
npm run lint:fix           # Correction automatique du linting
```

---

## 🏗️ Architecture

### Structure du projet
```
APP_BUDGET/
├── 📁 backend/              # API NestJS
│   ├── 📁 src/
│   │   ├── 📁 auth/         # Authentification JWT
│   │   ├── 📁 users/        # Gestion utilisateurs
│   │   ├── 📁 incomes/      # Revenus récurrents
│   │   ├── 📁 expenses/     # Dépenses récurrentes
│   │   ├── 📁 planned-expenses/ # Budgets ponctuels
│   │   ├── 📁 balance/      # Calculs de solde
│   │   └── 📁 prisma/       # Service base de données
│   ├── 📁 prisma/           # Schéma et migrations
│   └── 📄 docker-compose.yml # Stack PostgreSQL
│
├── 📁 src/                  # Frontend React
│   ├── 📁 components/
│   │   ├── 📁 auth/         # Composants d'authentification
│   │   ├── 📁 balance/      # Ajustement et réinitialisation
│   │   ├── 📁 screens/      # Écrans principaux (CRUD)
│   │   └── 📁 ui/           # Composants shadcn/ui
│   ├── 📁 services/         # API et gestion des requêtes
│   ├── 📁 store/            # Gestion d'état Zustand
│   └── 📁 types/            # Types TypeScript
│
└── 📄 README.md             # Cette documentation
```

---

## 🔐 Sécurité

### Mesures implémentées
- **Hachage bcryptjs** des mots de passe
- **JWT avec expiration** courte (15min) + refresh tokens (7j)
- **CORS configuré** pour le frontend uniquement
- **Rate limiting** (100 req/min par IP)
- **Validation stricte** des données d'entrée
- **Filtres d'exception** pour masquer les erreurs internes
- **Nettoyage automatique** des tokens expirés

---

## 📊 API Documentation

### 🔗 Endpoints principaux

#### Authentification (`/api/v1/auth`)
```
POST /register        # Inscription
POST /login          # Connexion  
POST /refresh        # Rafraîchir les tokens
POST /logout         # Déconnexion
GET  /me            # Profil utilisateur
```

#### Revenus (`/api/v1/incomes`)
```
GET    /             # Liste des revenus
POST   /             # Créer un revenu
PATCH  /:id          # Modifier un revenu
DELETE /:id          # Supprimer un revenu
GET    /total        # Total des revenus
GET    /by-category  # Revenus par catégorie
```

#### Dépenses (`/api/v1/expenses`)
```
GET    /             # Liste des dépenses
POST   /             # Créer une dépense
PATCH  /:id          # Modifier une dépense
DELETE /:id          # Supprimer une dépense
GET    /total        # Total des dépenses
GET    /upcoming     # Dépenses à venir
```

#### Budgets ponctuels (`/api/v1/planned`)
```
GET    /             # Liste des budgets
POST   /             # Créer un budget
PATCH  /:id          # Modifier un budget
DELETE /:id          # Supprimer un budget
GET    /statistics   # Statistiques des budgets
GET    /overdue      # Budgets en retard
```

#### **🆕 Gestion du solde** (`/api/v1/balance`)
```
GET    /             # Solde actuel avec ajustements
POST   /adjust       # Ajuster le solde manuellement
POST   /monthly-reset # Réinitialisation mensuelle
GET    /reset-status # Statut de la réinitialisation
GET    /projection   # Projection sur 30 jours
GET    /alerts       # Alertes de budget
GET    /summary      # Résumé complet
```

### 📖 Documentation interactive
- **Swagger UI** : http://localhost:3001/api/docs
- **Schémas complets** avec exemples
- **Test interactif** des endpoints
- **Codes de réponse** détaillés

---

## 🎯 Nouvelles fonctionnalités vs v1.0

| Fonctionnalité | v1.0 | v2.0 |
|---|---|---|
| **Stockage des données** | LocalStorage | PostgreSQL + API |
| **Authentification** | ❌ | ✅ JWT sécurisé |
| **Multi-utilisateurs** | ❌ | ✅ Comptes individuels |
| **Ajustement du solde** | ❌ | ✅ Interface dédiée |
| **Réinitialisation mensuelle** | ❌ | ✅ Automatique + historique |
| **Projections avancées** | Basique | ✅ Avec événements détaillés |
| **Marge de sécurité** | ❌ | ✅ Configurable 0-50% |
| **Historique des actions** | ❌ | ✅ Traçabilité complète |
| **API REST** | ❌ | ✅ Documentation Swagger |
| **Base de données** | ❌ | ✅ PostgreSQL avec Prisma |
| **Déploiement** | Static | ✅ Docker + Production ready |

---

## 🔧 Configuration

### Variables d'environnement

#### Backend (`.env`)
```bash
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/budget_app"

# JWT Security
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# API Configuration
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"
```

#### Frontend (`.env`)
```bash
# Backend API
VITE_API_URL=http://localhost:3001/api/v1
```

---

## 🚀 Déploiement

### Avec Docker (Recommandé)

```bash
# 1. Démarrer la stack complète
cd backend
docker-compose up -d

# 2. Build du frontend
cd ../
npm run build

# 3. L'application est prête !
# Backend: http://localhost:3001
# Frontend: http://localhost:5173 (dev) ou servir le build/
```

### Production manuelle

```bash
# 1. Build et démarrage du backend
cd backend
npm run build
npm run start:prod

# 2. Build du frontend
cd ../
npm run build
# Servir le dossier dist/ avec nginx ou serveur web
```

---
