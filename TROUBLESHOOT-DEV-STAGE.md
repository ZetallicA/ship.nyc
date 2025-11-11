# Troubleshooting Dev/Stage Environment

## Common Issues

### Issue 1: SSL Error (ERR_SSL_VERSION_OR_CIPHER_MISMATCH)

**Problem**: Dev/stage services not running with HTTPS enabled.

**Solution**:

1. **Check SSL certificates exist**:
   ```bash
   ls -la certs/
   # Should show: localhost.pem and localhost-key.pem
   ```

2. **If certificates missing, generate them**:
   ```powershell
   .\setup-https-docker.ps1
   ```
   Or manually:
   ```powershell
   mkcert -install
   cd certs
   mkcert localhost 127.0.0.1 ::1 192.168.8.199 0.0.0.0
   move localhost+4.pem localhost.pem
   move localhost+4-key.pem localhost-key.pem
   cd ..
   ```

3. **Check dev services are running**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
   # Should show: intership-backend-dev and intership-frontend-dev
   ```

4. **Check ports are listening**:
   ```bash
   # Windows
   netstat -ano | findstr "9445 9446"
   
   # Linux
   netstat -tuln | grep -E '9445|9446'
   ```

5. **Restart dev services**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

### Issue 2: Services Not Starting

**Problem**: Dev services fail to start.

**Solution**:

1. **Check logs**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs
   ```

2. **Check if ports are already in use**:
   ```bash
   # Windows
   netstat -ano | findstr "9445 9446 8001 8081"
   
   # Linux
   lsof -i :9445 -i :9446 -i :8001 -i :8081
   ```

3. **Check MongoDB is running** (dev services depend on it):
   ```bash
   docker-compose ps mongodb
   # Should show: intership-mongodb running
   ```

4. **Check network exists**:
   ```bash
   docker network ls | grep intership-network
   # If missing, create it:
   docker network create intership-network
   ```

### Issue 3: Cloudflare Tunnel Not Connecting

**Problem**: Cloudflare tunnel can't reach dev services.

**Solution**:

1. **Test direct access** (bypass Cloudflare):
   ```bash
   # From your local machine
   curl -k https://192.168.8.199:9445
   curl -k https://192.168.8.199:9446/api/health
   ```

2. **Check Cloudflare tunnel configuration**:
   - Verify routes point to correct ports:
     - `dev.mail.oathone.com` → `https://192.168.8.199:9445`
     - `dev.mailbackend.oathone.com` → `https://192.168.8.199:9446`

3. **Check firewall rules**:
   ```bash
   # Windows
   netsh advfirewall firewall show rule name=all | findstr "9445 9446"
   
   # Linux
   sudo ufw status | grep -E '9445|9446'
   ```

### Issue 4: Services Running But Not Accessible

**Problem**: Services are running but can't be accessed.

**Solution**:

1. **Check container logs**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs backend-dev
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs frontend-dev
   ```

2. **Check container health**:
   ```bash
   docker ps | grep intership
   # Should show: intership-backend-dev and intership-frontend-dev
   ```

3. **Test from inside container**:
   ```bash
   docker exec intership-backend-dev curl -k https://localhost:8443/api/health
   docker exec intership-frontend-dev curl -k https://localhost:3443
   ```

## Quick Fix Script

Create `fix-dev-stage.ps1`:

```powershell
# Quick fix for dev/stage environment

Write-Host "Fixing dev/stage environment..." -ForegroundColor Cyan

# Stop all services
Write-Host "Stopping services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Check certificates
if (-not (Test-Path "certs\localhost.pem")) {
    Write-Host "Generating SSL certificates..." -ForegroundColor Yellow
    .\setup-https-docker.ps1
}

# Ensure network exists
$networkExists = docker network inspect intership-network 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating network..." -ForegroundColor Yellow
    docker network create intership-network
}

# Start production services first (for MongoDB)
Write-Host "Starting production services..." -ForegroundColor Yellow
docker-compose up -d mongodb

# Wait for MongoDB
Start-Sleep -Seconds 5

# Start dev services
Write-Host "Starting dev services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Wait for services
Start-Sleep -Seconds 10

# Check status
Write-Host ""
Write-Host "Service status:" -ForegroundColor Cyan
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "Testing endpoints..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://192.168.8.199:9446/api/health" -SkipCertificateCheck -TimeoutSec 5
    Write-Host "✓ Backend is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
```

## Verification Checklist

- [ ] SSL certificates exist in `certs/` directory
- [ ] MongoDB container is running
- [ ] Dev services are running (`docker-compose ps`)
- [ ] Ports 9445 and 9446 are listening
- [ ] Direct access works (`curl -k https://192.168.8.199:9445`)
- [ ] Cloudflare routes are configured correctly
- [ ] Firewall allows ports 9445 and 9446

