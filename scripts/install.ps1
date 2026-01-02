# OpenFamily - Home Server Installation Script
# Usage: iex (iwr -useb "https://raw.githubusercontent.com/yourusername/OpenFamily/main/scripts/install.ps1").Content

param(
    [string]$InstallDir = "$env:USERPROFILE\openfamily"
)

Write-Host "🏠 OpenFamily Home Server Installation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check system requirements
Write-Host "🔍 Checking system requirements..." -ForegroundColor Yellow

# Check if Docker Desktop is installed
$dockerInstalled = $false
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        $dockerInstalled = $true
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
    }
} catch {
    $dockerInstalled = $false
}

if (-not $dockerInstalled) {
    Write-Host "📦 Docker Desktop not found. Please install Docker Desktop first:" -ForegroundColor Yellow
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "   After installation, restart your computer and run this script again." -ForegroundColor White
    exit 1
}

# Check if Docker is running
try {
    docker ps >$null 2>&1
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check available disk space (minimum 2GB)
$drive = (Get-Location).Drive
$freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$($drive.Name)'").FreeSpace / 1GB
if ($freeSpace -lt 2) {
    Write-Host "⚠️  Warning: Less than 2GB free space available ($([math]::Round($freeSpace, 2)) GB)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -notmatch '^[Yy]$') {
        exit 1
    }
}

# Set installation directory
Write-Host "📁 Installation directory: $InstallDir" -ForegroundColor Cyan

# Create installation directory
if (Test-Path $InstallDir) {
    Write-Host "⚠️  Directory $InstallDir already exists" -ForegroundColor Yellow
    $remove = Read-Host "Remove existing installation? (y/N)"
    if ($remove -match '^[Yy]$') {
        Remove-Item -Recurse -Force $InstallDir
        Write-Host "✅ Removed existing installation" -ForegroundColor Green
    } else {
        Write-Host "❌ Installation cancelled" -ForegroundColor Red
        exit 1
    }
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Set-Location $InstallDir

# Download OpenFamily
Write-Host "⬇️  Downloading OpenFamily..." -ForegroundColor Yellow

if (Get-Command git -ErrorAction SilentlyContinue) {
    git clone https://github.com/NexaFlowFrance/OpenFamily.git .
} else {
    $zipUrl = "https://github.com/NexaFlowFrance/OpenFamily/archive/main.zip"
    $zipPath = "$InstallDir\openfamily.zip"
    
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $InstallDir
    
    $extractedFolder = Get-ChildItem -Directory | Where-Object {$_.Name -like "*OpenFamily*"} | Select-Object -First 1
    if ($extractedFolder) {
        Get-ChildItem -Path $extractedFolder.FullName | Move-Item -Destination $InstallDir
        Remove-Item -Recurse -Force $extractedFolder.FullName
    }
    
    Remove-Item $zipPath
}

# Create .env file
Write-Host "⚙️  Configuring environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    
    # Generate secure password
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 25 | ForEach-Object {[char]$_})
    (Get-Content ".env") -replace "change-this-secure-password-123", $dbPassword | Set-Content ".env"
    
    Write-Host "✅ Environment configured with secure password" -ForegroundColor Green
}

# Get server IP
$serverIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object {$_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
if (-not $serverIP) {
    $serverIP = "localhost"
}
Write-Host "🌐 Server IP detected: $serverIP" -ForegroundColor Cyan

# Ask for custom domain (optional)
Write-Host ""
Write-Host "🌍 Domain Configuration (Optional)" -ForegroundColor Cyan
Write-Host "You can access OpenFamily via:"
Write-Host "  - Local: http://localhost:3000"
Write-Host "  - Network: http://$serverIP:3000"
$customDomain = Read-Host "Do you have a custom domain? Enter it (or press Enter to skip)"
if ($customDomain) {
    Add-Content -Path ".env" -Value "CUSTOM_DOMAIN=$customDomain"
    Write-Host "✅ Custom domain configured: $customDomain" -ForegroundColor Green
}

# Pull Docker images
Write-Host "🐳 Downloading Docker images..." -ForegroundColor Yellow
docker compose pull

# Start services
Write-Host "🚀 Starting OpenFamily services..." -ForegroundColor Yellow
docker compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$runningServices = docker compose ps --format json | ConvertFrom-Json
if ($runningServices.State -contains "running") {
    Write-Host "✅ OpenFamily is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Installation Complete!" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your OpenFamily server:"
    Write-Host "  🏠 Local: http://localhost:3000" -ForegroundColor White
    Write-Host "  🌐 Network: http://$serverIP:3000" -ForegroundColor White
    if ($customDomain) {
        Write-Host "  🌍 Domain: http://$customDomain:3000" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "📋 Management Commands:" -ForegroundColor Cyan
    Write-Host "  View logs: docker compose logs -f" -ForegroundColor White
    Write-Host "  Stop: docker compose down" -ForegroundColor White
    Write-Host "  Restart: docker compose restart" -ForegroundColor White
    Write-Host "  Update: .\scripts\update.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation: .\docs\" -ForegroundColor White
    Write-Host "🔧 Configuration: .\.env" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Important: Change the default password in Settings!" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Write-Host "Check logs: docker compose logs" -ForegroundColor Yellow
    exit 1
}