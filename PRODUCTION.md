# OpenFamily - Production Deployment

## Quick Start

### One-command Docker deployment:
```bash
curl -sSL https://raw.githubusercontent.com/NexaFlowFrance/OpenFamily/main/scripts/install.sh | bash
```

### Manual Docker deployment:
```bash
# Clone repository
git clone https://github.com/NexaFlowFrance/OpenFamily.git
cd OpenFamily

# Copy environment template
cp .env.example .env

# Edit configuration (required: change DB_PASSWORD)
nano .env

# Start services
docker-compose up -d

# Access at http://your-server-ip:3000
```

## Environment Configuration

### Required Environment Variables

Create `.env` file:
```env
# Database Configuration (REQUIRED - Change this password!)
DB_PASSWORD=your-secure-password-here
DB_NAME=openfamily
DB_USER=openfamily
DB_HOST=postgres
DB_PORT=5432

# Application Configuration
NODE_ENV=production
PORT=3000

# Optional: Web Push Notifications (for mobile notifications)
# Generate keys with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

### Security Recommendations

1. **Change default password**: Always change `DB_PASSWORD` from the example
2. **Use strong passwords**: At least 16 characters with mixed case, numbers, and symbols
3. **Enable HTTPS**: Configure reverse proxy with SSL certificate
4. **Firewall**: Only expose port 3000 or use reverse proxy
5. **Updates**: Keep system and Docker images updated

## Network Access

### Local Network Access
- Server: `http://localhost:3000`
- Network: `http://192.168.1.100:3000` (replace with your server IP)

### Internet Access (Advanced)
For internet access, configure:
1. **Domain name** pointing to your server
2. **Reverse proxy** (nginx/traefik) with SSL
3. **Firewall rules** for security

See `DEPLOYMENT.md` for detailed instructions.

## Backup & Restore

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U openfamily openfamily > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U openfamily openfamily < backup.sql
```

### Full Backup
```bash
# Stop services
docker-compose down

# Backup entire data directory
tar -czf openfamily-backup-$(date +%Y%m%d).tar.gz data/

# Start services
docker-compose up -d
```

## Monitoring

### Check Status
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check database connection
docker-compose exec app npm run check:db
```

### Performance Monitoring
- **CPU/Memory**: Use `htop` or `docker stats`
- **Disk**: Monitor database size and available space
- **Network**: Check port 3000 accessibility

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker-compose logs app
docker-compose logs postgres

# Reset containers
docker-compose down
docker-compose up -d
```

**Database connection error:**
```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: loses data)
docker-compose down
docker volume rm openfamily_postgres_data
docker-compose up -d
```

**Can't access from network:**
- Check server firewall settings
- Verify server IP address
- Ensure port 3000 is open
- Check `docker-compose.yml` port mapping

### Performance Optimization

**Database tuning:**
Edit `docker-compose.yml` and add to postgres service:
```yaml
command: postgres -c shared_buffers=256MB -c max_connections=200
```

**Memory limits:**
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

## Support

- **Documentation**: See `/docs` directory
- **Issues**: Report bugs on GitHub
- **Community**: Join discussions in GitHub Discussions

For production deployment assistance, see the full `DEPLOYMENT.md` guide.