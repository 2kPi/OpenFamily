#!/bin/bash

# OpenFamily - Installation Script for Home Server
# Usage: curl -sSL https://raw.githubusercontent.com/yourusername/OpenFamily/main/scripts/install.sh | bash

set -e

echo "🏠 OpenFamily Home Server Installation"
echo "====================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run this script as root"
    echo "Run as regular user: curl -sSL https://... | bash"
    exit 1
fi

# Check system requirements
echo "🔍 Checking system requirements..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed successfully"
    echo "⚠️  Please log out and log back in for Docker permissions to take effect"
    echo "Then run this script again."
    exit 0
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not available"
    echo "Please install Docker Compose and try again"
    exit 1
fi

# Check available disk space (minimum 2GB)
AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then
    echo "⚠️  Warning: Less than 2GB free space available"
    echo "OpenFamily requires at least 2GB of free space"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set installation directory
INSTALL_DIR="$HOME/openfamily"
echo "📁 Installation directory: $INSTALL_DIR"

# Create installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Directory $INSTALL_DIR already exists"
    read -p "Remove existing installation? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        echo "✅ Removed existing installation"
    else
        echo "❌ Installation cancelled"
        exit 1
    fi
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download OpenFamily
echo "⬇️  Downloading OpenFamily..."
if command -v git &> /dev/null; then
    git clone https://github.com/NexaFlowFrance/OpenFamily.git .
else
    curl -L https://github.com/NexaFlowFrance/OpenFamily/archive/main.zip -o openfamily.zip
    unzip openfamily.zip
    mv OpenFamily-main/* .
    rm -rf OpenFamily-main openfamily.zip
fi

# Create .env file
echo "⚙️  Configuring environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Generate secure password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    sed -i "s/change-this-secure-password-123/$DB_PASSWORD/" .env
    
    echo "✅ Environment configured with secure password"
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "🌐 Server IP detected: $SERVER_IP"

# Ask for custom domain (optional)
echo ""
echo "🌍 Domain Configuration (Optional)"
echo "You can access OpenFamily via:"
echo "  - Local: http://localhost:3000"
echo "  - Network: http://$SERVER_IP:3000"
read -p "Do you have a custom domain? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain (e.g., family.example.com): " CUSTOM_DOMAIN
    if [ ! -z "$CUSTOM_DOMAIN" ]; then
        echo "CUSTOM_DOMAIN=$CUSTOM_DOMAIN" >> .env
        echo "✅ Custom domain configured: $CUSTOM_DOMAIN"
    fi
fi

# Pull Docker images
echo "🐳 Downloading Docker images..."
docker compose pull

# Start services
echo "🚀 Starting OpenFamily services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo "✅ OpenFamily is running!"
    echo ""
    echo "🎉 Installation Complete!"
    echo "========================"
    echo ""
    echo "Access your OpenFamily server:"
    echo "  🏠 Local: http://localhost:3000"
    echo "  🌐 Network: http://$SERVER_IP:3000"
    if [ ! -z "$CUSTOM_DOMAIN" ]; then
        echo "  🌍 Domain: http://$CUSTOM_DOMAIN:3000"
    fi
    echo ""
    echo "📋 Management Commands:"
    echo "  View logs: cd $INSTALL_DIR && docker compose logs -f"
    echo "  Stop: cd $INSTALL_DIR && docker compose down"
    echo "  Restart: cd $INSTALL_DIR && docker compose restart"
    echo "  Update: cd $INSTALL_DIR && ./scripts/update.sh"
    echo ""
    echo "📚 Documentation: $INSTALL_DIR/docs/"
    echo "🔧 Configuration: $INSTALL_DIR/.env"
    echo ""
    echo "⚠️  Important: Change the default password in Settings!"
else
    echo "❌ Failed to start services"
    echo "Check logs: cd $INSTALL_DIR && docker compose logs"
    exit 1
fi