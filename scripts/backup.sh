#!/bin/bash

# OpenFamily Backup Script
echo "💾 OpenFamily Backup Utility"
echo "============================"

# Check if we're in OpenFamily directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ This doesn't appear to be an OpenFamily directory"
    echo "Please run this script from your OpenFamily installation directory"
    exit 1
fi

# Get backup type
BACKUP_TYPE=${1:-"full"}
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$BACKUP_DATE"

echo "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

case $BACKUP_TYPE in
    "database"|"db")
        echo "📦 Creating database backup..."
        docker compose exec postgres pg_dump -U openfamily openfamily > "$BACKUP_DIR/database.sql"
        echo "✅ Database backup completed"
        ;;
        
    "files")
        echo "📂 Creating files backup..."
        cp .env "$BACKUP_DIR/.env"
        cp -r docker/ "$BACKUP_DIR/docker/" 2>/dev/null || true
        cp -r data/ "$BACKUP_DIR/data/" 2>/dev/null || true
        echo "✅ Files backup completed"
        ;;
        
    "full"|*)
        echo "🗃️  Creating full backup..."
        
        # Database backup
        echo "  📦 Backing up database..."
        docker compose exec postgres pg_dump -U openfamily openfamily > "$BACKUP_DIR/database.sql"
        
        # Configuration backup
        echo "  ⚙️  Backing up configuration..."
        cp .env "$BACKUP_DIR/.env"
        
        # Docker volumes backup
        echo "  🐳 Backing up Docker volumes..."
        docker run --rm -v $(pwd)/data:/data -v "$BACKUP_DIR:/backup" alpine tar czf /backup/docker-volumes.tar.gz -C /data .
        
        # Application files backup (if needed)
        echo "  📁 Backing up custom files..."
        if [ -d "custom/" ]; then
            cp -r custom/ "$BACKUP_DIR/custom/"
        fi
        
        echo "✅ Full backup completed"
        ;;
esac

# Create backup info file
cat > "$BACKUP_DIR/backup-info.txt" << EOF
OpenFamily Backup Information
============================
Backup Date: $(date)
Backup Type: $BACKUP_TYPE
OpenFamily Version: $(git describe --tags 2>/dev/null || echo "Unknown")
Docker Images:
$(docker compose images)

Files included:
$(ls -la "$BACKUP_DIR")
EOF

# Compress backup
echo "🗜️  Compressing backup..."
tar czf "$BACKUP_DIR.tar.gz" -C "backups" "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

# Calculate size
BACKUP_SIZE=$(du -h "$BACKUP_DIR.tar.gz" | cut -f1)

echo ""
echo "✅ Backup completed successfully!"
echo "📄 Backup file: $BACKUP_DIR.tar.gz"
echo "📊 Size: $BACKUP_SIZE"
echo ""
echo "📋 To restore this backup:"
echo "  ./scripts/restore.sh $BACKUP_DIR.tar.gz"
echo ""
echo "🗃️  All backups:"
ls -lh backups/*.tar.gz 2>/dev/null || echo "  (No previous backups found)"

# Cleanup old backups (keep last 5)
echo ""
echo "🧹 Cleaning up old backups..."
cd backups
ls -t *.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
BACKUP_COUNT=$(ls *.tar.gz 2>/dev/null | wc -l)
echo "📁 Keeping $BACKUP_COUNT most recent backups"