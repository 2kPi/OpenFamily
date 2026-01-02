# OpenFamily Update Script for Windows
Write-Host "🔄 Updating OpenFamily..." -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Check if we're in OpenFamily directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ This doesn't appear to be an OpenFamily directory" -ForegroundColor Red
    Write-Host "Please run this script from your OpenFamily installation directory" -ForegroundColor Yellow
    exit 1
}

# Backup current version
Write-Host "💾 Creating backup..." -ForegroundColor Yellow
$backupDir = "backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup database
Write-Host "📦 Backing up database..." -ForegroundColor Yellow
docker compose exec postgres pg_dump -U openfamily openfamily | Out-File -FilePath "$backupDir\database.sql" -Encoding UTF8

# Backup .env file
Copy-Item ".env" "$backupDir\.env"
Write-Host "✅ Backup created in $backupDir" -ForegroundColor Green

# Stop services
Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
docker compose down

# Pull latest changes
Write-Host "⬇️  Downloading updates..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    git pull origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to pull updates" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Git not available. Please download latest version manually." -ForegroundColor Yellow
    Write-Host "Visit: https://github.com/NexaFlowFrance/OpenFamily/releases" -ForegroundColor White
    exit 1
}

# Update Docker images
Write-Host "🐳 Updating Docker images..." -ForegroundColor Yellow
docker compose pull

# Start services
Write-Host "🚀 Starting updated services..." -ForegroundColor Yellow
docker compose up -d

# Wait for services
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$runningServices = docker compose ps --format json | ConvertFrom-Json
if ($runningServices.State -contains "running") {
    Write-Host "✅ Update completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was updated:" -ForegroundColor Cyan
    Write-Host "  - Application code updated to latest version" -ForegroundColor White
    Write-Host "  - Docker images updated" -ForegroundColor White
    Write-Host "  - Database preserved with backup" -ForegroundColor White
    Write-Host ""
    Write-Host "🗃️  Backup location: $backupDir" -ForegroundColor White
    Write-Host "🌐 Access: http://localhost:3000" -ForegroundColor White
} else {
    Write-Host "❌ Update failed! Restoring from backup..." -ForegroundColor Red
    
    # Stop failed services
    docker compose down
    
    # Restore database
    Write-Host "🔄 Restoring database..." -ForegroundColor Yellow
    docker compose up postgres -d
    Start-Sleep -Seconds 5
    Get-Content "$backupDir\database.sql" | docker compose exec -T postgres psql -U openfamily openfamily
    
    # Restore .env
    Copy-Item "$backupDir\.env" ".env"
    
    # Start services
    docker compose up -d
    
    Write-Host "✅ Restored from backup" -ForegroundColor Green
    Write-Host "❌ Update failed. Please check the logs and try again." -ForegroundColor Red
    exit 1
}