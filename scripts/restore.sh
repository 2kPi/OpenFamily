#!/bin/bash

# OpenFamily Restore Script
echo "🔄 OpenFamily Restore Utility"
echo "============================="

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -la backups/*.tar.gz 2>/dev/null || echo "  (No backups found)"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if we're in OpenFamily directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ This doesn't appear to be an OpenFamily directory"
    echo "Please run this script from your OpenFamily installation directory"
    exit 1
fi

echo "📄 Backup file: $BACKUP_FILE"
echo "⚠️  This will replace current data with backup data"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Create temporary restore directory
RESTORE_DIR="restore_temp"
rm -rf "$RESTORE_DIR"
mkdir -p "$RESTORE_DIR"

# Extract backup
echo "📦 Extracting backup..."
tar xzf "$BACKUP_FILE" -C "$RESTORE_DIR" --strip-components=1

# Display backup info
if [ -f "$RESTORE_DIR/backup-info.txt" ]; then
    echo ""
    echo "📋 Backup Information:"
    cat "$RESTORE_DIR/backup-info.txt"
    echo ""
fi

# Stop services
echo "🛑 Stopping services..."
docker compose down

# Restore database
if [ -f "$RESTORE_DIR/database.sql" ]; then
    echo "🗄️  Restoring database..."
    
    # Start only postgres
    docker compose up postgres -d
    sleep 5
    
    # Drop and recreate database
    docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS openfamily;"
    docker compose exec postgres psql -U postgres -c "CREATE DATABASE openfamily OWNER openfamily;"
    
    # Restore data
    docker compose exec -T postgres psql -U openfamily openfamily < "$RESTORE_DIR/database.sql"
    echo "✅ Database restored"
fi

# Restore configuration
if [ -f "$RESTORE_DIR/.env" ]; then
    echo "⚙️  Restoring configuration..."
    cp "$RESTORE_DIR/.env" .env
    echo "✅ Configuration restored"
fi

# Restore Docker volumes
if [ -f "$RESTORE_DIR/docker-volumes.tar.gz" ]; then
    echo "🐳 Restoring Docker volumes..."
    mkdir -p data
    tar xzf "$RESTORE_DIR/docker-volumes.tar.gz" -C data/
    echo "✅ Docker volumes restored"
fi

# Restore custom files
if [ -d "$RESTORE_DIR/custom" ]; then
    echo "📁 Restoring custom files..."
    cp -r "$RESTORE_DIR/custom" ./
    echo "✅ Custom files restored"
fi

# Cleanup temporary directory
rm -rf "$RESTORE_DIR"

# Start all services
echo "🚀 Starting services..."
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Restore completed successfully!"
    echo "🌐 Access your restored OpenFamily at: http://localhost:3000"
    echo ""
    echo "📋 What was restored:"
    [ -f "$BACKUP_FILE" ] && echo "  - Database from backup"
    [ -f ".env" ] && echo "  - Configuration file"
    [ -d "data" ] && echo "  - Docker volumes"
    [ -d "custom" ] && echo "  - Custom files"
else
    echo "❌ Restore failed!"
    echo "Check logs: docker compose logs"
    exit 1
fi