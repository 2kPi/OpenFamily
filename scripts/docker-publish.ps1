# OpenFamily Docker Hub Publication Script for Windows
param(
    [string]$Version = "latest"
)

Write-Host "🐳 Building and Publishing OpenFamily to Docker Hub" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Configuration
$DockerImage = "nexaflow/openfamily"
$Platform = "linux/amd64,linux/arm64"

# Check if logged in to Docker Hub
$dockerInfo = docker info 2>$null
if (-not ($dockerInfo -match "Username")) {
    Write-Host "❌ Please login to Docker Hub first:" -ForegroundColor Red
    Write-Host "   docker login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Build Configuration:" -ForegroundColor Cyan
Write-Host "   Image: $DockerImage:$Version" -ForegroundColor White
Write-Host "   Platforms: $Platform" -ForegroundColor White
Write-Host "   Context: Current directory" -ForegroundColor White
Write-Host ""

# Confirm build
$continue = Read-Host "Continue with build and push? (y/N)"
if ($continue -notmatch '^[Yy]$') {
    Write-Host "❌ Build cancelled" -ForegroundColor Red
    exit 1
}

# Create buildx builder if not exists
Write-Host "🔧 Setting up Docker buildx..." -ForegroundColor Yellow
$builderExists = docker buildx ls | Select-String "multiarch"
if (-not $builderExists) {
    docker buildx create --name multiarch --use
    docker buildx inspect --bootstrap
} else {
    docker buildx use multiarch
}

# Build and push
Write-Host "🏗️  Building multi-platform image..." -ForegroundColor Yellow
$buildResult = docker buildx build `
    --platform $Platform `
    --tag "$DockerImage:$Version" `
    --tag "$DockerImage:latest" `
    --push `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully published to Docker Hub!" -ForegroundColor Green
    Write-Host "🐳 Image: $DockerImage:$Version" -ForegroundColor White
    Write-Host "📦 Platforms: $Platform" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Docker Hub: https://hub.docker.com/r/nexaflow/openfamily" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Usage:" -ForegroundColor Cyan
    Write-Host "   docker pull $DockerImage:$Version" -ForegroundColor White
    Write-Host "   docker run -d -p 3000:3000 $DockerImage:$Version" -ForegroundColor White
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}