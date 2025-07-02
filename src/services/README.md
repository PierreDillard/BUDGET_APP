# Services API - Structure Modulaire

Ce dossier contient les services API refactorisés pour une meilleure maintenabilité et organisation.

## Structure

### Fichiers principaux

- **`index.ts`** - Point d'entrée principal qui exporte tous les services
- **`api.ts`** - Fichier de compatibilité qui re-exporte depuis `index.ts`

### Modules de configuration et utilitaires

- **`config.ts`** - Configuration de l'API (URL de base)
- **`types.ts`** - Types TypeScript spécifiques aux services API
- **`tokenManager.ts`** - Gestion des tokens d'authentification
- **`baseApiService.ts`** - Classe de base avec la logique HTTP commune

### Services métier

- **`authService.ts`** - Service d'authentification (login, register, logout)
- **`incomeService.ts`** - Service de gestion des revenus
- **`expenseService.ts`** - Service de gestion des dépenses récurrentes
- **`plannedExpenseService.ts`** - Service de gestion des dépenses planifiées
- **`balanceService.ts`** - Service de gestion du solde et projections
- **`userService.ts`** - Service de gestion du profil utilisateur

## Usage

### Import standard (compatibilité avec l'ancien code)

```typescript
import { apiService, TokenManager } from './services/api';

// Utilisation identique à avant
const incomes = await apiService.getIncomes();
```

### Import modulaire (nouveau style recommandé)

```typescript
import { incomeService, authService } from './services';

// Utilisation des services spécifiques
const incomes = await incomeService.getIncomes();
const user = await authService.getCurrentUser();
```

### Import de services individuels

```typescript
import { IncomeService } from './services/incomeService';

const incomeService = new IncomeService();
```

## Avantages de cette structure

1. **Séparation des responsabilités** - Chaque service a une responsabilité claire
2. **Réutilisabilité** - Les services peuvent être utilisés indépendamment
3. **Testabilité** - Plus facile de tester chaque service isolément
4. **Maintenabilité** - Code plus organisé et plus facile à maintenir
5. **Extensibilité** - Facile d'ajouter de nouveaux services
6. **Compatibilité** - L'ancien code continue de fonctionner sans modification

## Types disponibles

Tous les types sont exportés depuis `./services/types.ts` :

- `AuthTokens`
- `LoginRequest`
- `RegisterRequest` 
- `LoginResponse`
- `BalanceAdjustmentRequest`

## Gestion des tokens

Le `TokenManager` est disponible pour la gestion manuelle des tokens :

```typescript
import { TokenManager } from './services';

// Vérifier si l'utilisateur est authentifié
const isAuth = TokenManager.isAuthenticated();

// Obtenir le token d'accès
const token = TokenManager.getAccessToken();
```
