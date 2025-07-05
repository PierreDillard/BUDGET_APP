# Déploiement simplifié pour Budget App

## Processus de déploiement

Le déploiement de l'application a été simplifié pour permettre un "push-to-deploy" sur la branche main.

### Déploiement automatique

1. Lorsqu'un push est effectué sur la branche `main`, GitHub Actions déclenche automatiquement le pipeline CI/CD.
2. Le pipeline se connecte au serveur de production via SSH.
3. Il effectue les opérations suivantes :
   - Pull des dernières modifications du dépôt
   - Sauvegarde de la base de données
   - Reconstruction et redémarrage des conteneurs avec Docker Compose
   - Nettoyage des images Docker inutilisées

### Déploiement manuel

Si vous avez besoin de déployer manuellement l'application, vous pouvez utiliser le script `deploy.sh` :

```bash
# Pour déployer en production
./deploy.sh production

# Pour déployer en développement
./deploy.sh dev
```

## Configuration requise

Pour que le déploiement automatique fonctionne, vous devez configurer les secrets suivants dans GitHub :

- `PRODUCTION_HOST` : L'hôte du serveur de production
- `PRODUCTION_USER` : L'utilisateur SSH du serveur de production
- `PRODUCTION_SSH_KEY` : La clé SSH privée pour se connecter au serveur de production

## Structure Docker

L'application utilise une configuration Docker simplifiée :

- `docker-compose.dev.yml` : Pour l'environnement de développement
- `docker-compose.prod.yml` : Pour l'environnement de production
- `Dockerfile` : Pour construire l'application (frontend et backend)
