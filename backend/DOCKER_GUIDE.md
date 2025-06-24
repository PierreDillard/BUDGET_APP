# 🐳 Guide Docker pour Budget App Backend

## 🚨 Solution au problème d'authentification

Le problème que vous rencontrez vient d'une incohérence entre les identifiants de base de données. Voici la solution :

### ⚡ Solution rapide

```bash
cd backend

# 1. Nettoyer l'environnement
chmod +x setup-docker.sh && ./setup-docker.sh
./clean-docker.sh

# 2. Redémarrer proprement
./start-docker.sh
```

### 🔧 Solution manuelle

```bash
cd backend

# 1. Arrêter les conteneurs existants
docker-compose down

# 2. Recréer le fichier .env avec les bons identifiants
cat > .env << EOF
DATABASE_URL="postgresql://postgres:password123@localhost:5432/budget_app?schema=public"
JWT_SECRET="dev-budget-app-jwt-secret-key-2025"
JWT_REFRESH_SECRET="dev-budget-app-refresh-secret-key-2025"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
EOF

# 3. Démarrer PostgreSQL
docker-compose up postgres -d

# 4. Attendre 30 secondes
sleep 30

# 5. Installer et migrer
npm install
npx prisma generate
npx prisma migrate deploy

# 6. Démarrer le backend
npm run start:dev
```

## 📋 Identifiants de la base de données Docker

- **Host** : localhost
- **Port** : 5432
- **Database** : budget_app
- **User** : postgres
- **Password** : password123
- **URL complète** : `postgresql://postgres:password123@localhost:5432/budget_app`

## 🛠️ Scripts disponibles

| Script | Description |
|--------|-------------|
| `./start-docker.sh` | 🚀 Démarrage complet avec PostgreSQL Docker |
| `./test-docker.sh` | 🔍 Test de connexion à PostgreSQL |
| `./clean-docker.sh` | 🧹 Nettoyage complet de l'environnement |
| `./setup-docker.sh` | ⚙️ Configuration des permissions |

## 🔍 Diagnostic en cas de problème

### 1. Vérifier Docker
```bash
docker --version
docker-compose --version
```

### 2. Vérifier le conteneur PostgreSQL
```bash
docker ps | grep postgres
docker logs budget-postgres
```

### 3. Tester la connexion
```bash
./test-docker.sh
```

### 4. Vérifier le fichier .env
```bash
cat .env
# Doit contenir : DATABASE_URL="postgresql://postgres:password123@localhost:5432/budget_app"
```

## 🆘 Résolution des erreurs courantes

### Erreur "Authentication failed"
- **Cause** : Identifiants incorrects dans .env
- **Solution** : Recréer le .env avec les bons identifiants (voir solution manuelle)

### Erreur "Connection refused"
- **Cause** : PostgreSQL pas encore prêt
- **Solution** : Attendre 30-60 secondes après `docker-compose up`

### Erreur "Port already in use"
- **Cause** : Un autre PostgreSQL est déjà en cours
- **Solution** : `docker-compose down` puis redémarrer

### Erreur "Volume in use"
- **Cause** : Ancien volume avec mauvaises données
- **Solution** : `./clean-docker.sh` puis redémarrer

## 🎯 URLs après démarrage réussi

- **Backend API** : http://localhost:3001/api/v1
- **Documentation** : http://localhost:3001/api/docs
- **Health Check** : http://localhost:3001/api/v1/health
- **Prisma Studio** : `npm run db:studio` (port 5555)

## 🛑 Arrêt

```bash
# Arrêter le backend : Ctrl+C
# Arrêter PostgreSQL : 
docker-compose down
```

## 📝 Notes importantes

1. **Premier démarrage** : Peut prendre 1-2 minutes
2. **Données persistantes** : Les données restent entre les redémarrages
3. **Nettoyage complet** : Utiliser `./clean-docker.sh` pour repartir à zéro
4. **Frontend** : Démarrer séparément avec `npm run dev` depuis la racine
