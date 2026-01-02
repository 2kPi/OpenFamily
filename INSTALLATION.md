# 🏠 OpenFamily - Guide de Déploiement Maison

## Installation Rapide (1 commande)

### Linux/macOS
```bash
curl -sSL https://raw.githubusercontent.com/NexaFlowFrance/OpenFamily/main/scripts/install.sh | bash
```

### Windows (PowerShell en tant qu'Administrateur)
```powershell
iex (iwr -useb "https://raw.githubusercontent.com/NexaFlowFrance/OpenFamily/main/scripts/install.ps1").Content
```

### Avec Docker Hub (Image pré-construite)
```bash
# Télécharger uniquement la configuration
curl -L https://github.com/NexaFlowFrance/OpenFamily/archive/main.zip -o openfamily.zip
unzip openfamily.zip && cd OpenFamily-main

# Utiliser l'image Docker Hub
docker compose pull
docker compose up -d
```

## Prérequis

- **Docker Desktop** (Windows/macOS) ou **Docker + Docker Compose** (Linux)
- **2 GB d'espace libre** minimum
- **Port 3000** disponible
- **Connexion Internet** pour télécharger les images

## Installation Manuelle

### 1. Télécharger OpenFamily
```bash
git clone https://github.com/NexaFlowFrance/OpenFamily.git
cd OpenFamily
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
# Éditez .env et changez le mot de passe par défaut !
```

### 3. Lancer les services
```bash
docker compose up -d
```

### 4. Accéder à l'application
- **Local** : http://localhost:3000
- **Réseau** : http://VOTRE-IP-SERVEUR:3000

## Accès Réseau

### Trouver l'IP de votre serveur
```bash
# Linux/macOS
ip addr show | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

### Ouvrir le pare-feu (si nécessaire)
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload

# Windows
# Panneau de configuration > Pare-feu Windows > Règles entrantes > Nouvelle règle > Port 3000
```

## Configuration HTTPS (Optionnel)

### 1. Obtenir un certificat SSL
```bash
# Avec Let's Encrypt (domaine requis)
sudo apt install certbot
sudo certbot certonly --standalone -d votre-domaine.com
```

### 2. Configurer nginx
```bash
# Copier les certificats
mkdir -p docker/ssl
sudo cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem docker/ssl/

# Activer nginx avec SSL
docker compose --profile ssl up -d
```

## Gestion au Quotidien

### Commandes Essentielles
```bash
# Voir les logs
docker compose logs -f

# Redémarrer l'application
docker compose restart

# Arrêter l'application
docker compose down

# Mettre à jour
./scripts/update.sh    # Linux/macOS
.\scripts\update.ps1   # Windows
```

### Sauvegardes
```bash
# Sauvegarde complète
./scripts/backup.sh

# Sauvegarde base de données uniquement
./scripts/backup.sh database

# Restaurer une sauvegarde
./scripts/restore.sh backups/20250102_143022.tar.gz
```

## Résolution de Problèmes

### L'application ne démarre pas
```bash
# Vérifier les services
docker compose ps

# Voir les erreurs
docker compose logs app
docker compose logs postgres
```

### Problème de base de données
```bash
# Redémarrer uniquement la base
docker compose restart postgres

# Vérifier la connexion
docker compose exec postgres psql -U openfamily -d openfamily -c "SELECT 1;"
```

### Pas d'accès réseau
- Vérifier que le port 3000 est ouvert dans le pare-feu
- Vérifier l'IP du serveur
- S'assurer que Docker n'est pas en mode NAT

### Réinitialiser l'installation
```bash
# ATTENTION : Supprime toutes les données !
docker compose down -v
docker system prune -f
# Puis relancer l'installation
```

## Surveillance

### Vérifier la santé des services
```bash
# Status des conteneurs
docker compose ps

# Utilisation des ressources
docker stats

# Logs en temps réel
docker compose logs -f --tail=50
```

### Audit de sécurité
```bash
# Lancer l'audit de sécurité
./scripts/security-audit.sh    # Linux/macOS
.\scripts\security-audit.ps1   # Windows
```

## Support

- 📚 **Documentation complète** : `/docs/`
- 🐛 **Signaler un bug** : GitHub Issues
- 💬 **Discussions** : GitHub Discussions
- 📧 **Contact** : your-email@example.com

## Liens Utiles

- **Interface Web** : http://localhost:3000
- **API Health** : http://localhost:3000/api/health
- **Documentation API** : http://localhost:3000/api/docs
- **Métriques** : http://localhost:3000/api/metrics

---

**🎉 Félicitations ! OpenFamily est maintenant installé et prêt à organiser votre famille !**