#!/bin/bash

# OpenFamily Docker Hub Publication Script
echo "🐳 Building and Publishing OpenFamily to Docker Hub"
echo "=================================================="

# Configuration
DOCKER_IMAGE="nexaflow/openfamily"
VERSION=${1:-"latest"}
PLATFORM="linux/amd64,linux/arm64"

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    echo "❌ Please login to Docker Hub first:"
    echo "   docker login"
    exit 1
fi

echo "📋 Build Configuration:"
echo "   Image: $DOCKER_IMAGE:$VERSION"
echo "   Platforms: $PLATFORM"
echo "   Context: Current directory"
echo ""

# Confirm build
read -p "Continue with build and push? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Build cancelled"
    exit 1
fi

# Create buildx builder if not exists
echo "🔧 Setting up Docker buildx..."
if ! docker buildx ls | grep -q "multiarch"; then
    docker buildx create --name multiarch --use
    docker buildx inspect --bootstrap
else
    docker buildx use multiarch
fi

# Build and push
echo "🏗️  Building multi-platform image..."
docker buildx build \
    --platform $PLATFORM \
    --tag $DOCKER_IMAGE:$VERSION \
    --tag $DOCKER_IMAGE:latest \
    --push \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully published to Docker Hub!"
    echo "🐳 Image: $DOCKER_IMAGE:$VERSION"
    echo "📦 Platforms: $PLATFORM"
    echo ""
    echo "🔗 Docker Hub: https://hub.docker.com/r/nexaflow/openfamily"
    echo ""
    echo "📋 Usage:"
    echo "   docker pull $DOCKER_IMAGE:$VERSION"
    echo "   docker run -d -p 3000:3000 $DOCKER_IMAGE:$VERSION"
else
    echo "❌ Build failed!"
    exit 1
fi