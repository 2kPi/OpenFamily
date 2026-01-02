#!/bin/bash

# OpenFamily Update Script
echo "🔄 Updating OpenFamily..."
echo "========================"

# Check if we're in OpenFamily directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ This doesn't appear to be an OpenFamily directory"
    echo "Please run this script from your OpenFamily installation directory"
    exit 1
fi

# Backup current version
echo "💾 Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
echo "📦 Backing up database..."
docker compose exec postgres pg_dump -U openfamily openfamily > "$BACKUP_DIR/database.sql"

# Backup .env file
cp .env "$BACKUP_DIR/.env"
echo "✅ Backup created in $BACKUP_DIR"

# Stop services
echo "🛑 Stopping services..."
docker compose down

# Pull latest changes
echo "⬇️  Downloading updates..."
if command -v git &> /dev/null; then
    git pull origin main
else
    echo "⚠️  Git not available. Please download latest version manually."
    echo "Visit: https://github.com/NexaFlowFrance/OpenFamily/releases"
    exit 1
fi

# Update Docker images
echo "🐳 Updating Docker images..."
docker compose pull

# Start services
echo "🚀 Starting updated services..."
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo "✅ Update completed successfully!"
    echo ""
    echo "📋 What was updated:"
    echo "  - Application code updated to latest version"
    echo "  - Docker images updated"
    echo "  - Database preserved with backup"
    echo ""
    echo "🗃️  Backup location: $BACKUP_DIR"
    echo "🌐 Access: http://localhost:3000"
else
    echo "❌ Update failed! Restoring from backup..."
    
    # Stop failed services
    docker compose down
    
    # Restore database
    echo "🔄 Restoring database..."
    docker compose up postgres -d
    sleep 5
    docker compose exec -T postgres psql -U openfamily openfamily < "$BACKUP_DIR/database.sql"
    
    # Restore .env
    cp "$BACKUP_DIR/.env" .env
    
    # Start services
    docker compose up -d
    
    echo "✅ Restored from backup"
    echo "❌ Update failed. Please check the logs and try again."
    exit 1
fi