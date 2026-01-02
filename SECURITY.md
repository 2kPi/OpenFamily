# OpenFamily Security Configuration

## Security Headers (Nginx/Apache)

```nginx
# Add to your nginx.conf or virtual host configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Rate Limiting Configuration

```javascript
// Add to server/app.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

## Environment Security

```env
# Security-related environment variables
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-very-long-random-secret-key-here
CORS_ORIGIN=https://yourdomain.com
```

## Database Security

```sql
-- Create restricted database user for application
CREATE ROLE openfamily_app LOGIN PASSWORD 'secure_app_password';
GRANT CONNECT ON DATABASE openfamily TO openfamily_app;
GRANT USAGE ON SCHEMA public TO openfamily_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO openfamily_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO openfamily_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM public;
```

## Docker Security

```yaml
# Add to docker-compose.yml
version: '3.8'
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    user: "1001:1001"
    
  postgres:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/postgresql
```

## Package Security Updates

```bash
# Regular security audit commands
pnpm audit --audit-level moderate
pnpm update --latest
npm audit fix --force

# Check for known vulnerabilities
npx audit-ci --config audit-ci.json
```

## Firewall Configuration

```bash
# UFW (Ubuntu) configuration
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 3000/tcp
ufw enable
```

## SSL/TLS Configuration

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## Security Monitoring

```bash
# Log monitoring commands
tail -f /var/log/nginx/access.log | grep "40[0-9]"
docker-compose logs app | grep "Error"
```