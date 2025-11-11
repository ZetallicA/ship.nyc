# Development Workflow & Deployment Guide

## Recommended Approach: Single Repository with Branches ✅

**Recommendation**: Use a **single GitHub repository** (`https://github.com/ZetallicA/ship.nyc`) with **branch-based workflow**. This is simpler, more maintainable, and follows industry best practices.

**Why Single Repository?**
- ✅ Single source of truth
- ✅ Easy to merge changes between dev and production
- ✅ Simple deployment process
- ✅ No code duplication
- ✅ Easy rollback
- ✅ Standard industry practice (GitFlow)

### Repository Structure

```
ship.nyc (main repository)
├── main (production branch)
├── develop (development branch)
└── feature/* (feature branches)
```

## Workflow Strategy

### Option 1: Branch-Based (Recommended) ✅

**Single Repository**: `https://github.com/ZetallicA/ship.nyc`

**Branches**:
- `main` - Production code (deployed to VPS)
- `develop` - Development/staging code (deployed to dev.mail.oathone.com)
- `feature/*` - Feature branches

**Workflow**:
1. **Develop locally** → Push to `develop` branch
2. **Test on dev/stage** → Deploy `develop` to dev.mail.oathone.com
3. **Ready for production** → Merge `develop` → `main`
4. **Deploy to VPS** → Pull `main` branch on VPS

**Advantages**:
- ✅ Single source of truth
- ✅ Easy to merge changes
- ✅ Simple deployment process
- ✅ No code duplication
- ✅ Easy rollback

### Option 2: Separate Repositories (Not Recommended)

**Two Repositories**:
- `ship.nyc-dev` - Development code
- `ship.nyc-prod` - Production code

**Disadvantages**:
- ❌ Code duplication
- ❌ Harder to sync changes
- ❌ More maintenance overhead
- ❌ Risk of divergence

## Development Environment Setup

### Local Development

1. **Clone repository**:
   ```bash
   git clone https://github.com/ZetallicA/ship.nyc.git
   cd ship.nyc
   ```

2. **Create development branch**:
   ```bash
   git checkout -b develop
   ```

3. **Start local development**:
   ```bash
   docker-compose up -d
   ```

4. **Access locally**:
   - Frontend: `http://localhost:8080`
   - Backend: `http://localhost:8000/api`

### Dev/Stage Environment (dev.mail.oathone.com)

1. **Deploy develop branch**:
   ```bash
   # On dev server
   git checkout develop
   git pull origin develop
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```

2. **Access dev/stage**:
   - Frontend: `https://dev.mail.oathone.com`
   - Backend: `https://dev.mailbackend.oathone.com/api`

## Production Deployment (VPS)

### Initial VPS Setup

1. **SSH into VPS**:
   ```bash
   ssh user@your-vps-ip
   ```

2. **Install Docker & Docker Compose**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo apt-get install docker-compose-plugin
   ```

3. **Clone repository**:
   ```bash
   git clone https://github.com/ZetallicA/ship.nyc.git
   cd ship.nyc
   ```

4. **Create production environment file**:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production values
   ```

5. **Set up SSL certificates** (if not using Cloudflare):
   ```bash
   # Use Let's Encrypt or your SSL provider
   ```

6. **Start production services**:
   ```bash
   git checkout main
   docker-compose up -d --build
   ```

### Production Deployment Script

Create `deploy-production.sh` on VPS:

```bash
#!/bin/bash
# Production Deployment Script

cd /path/to/ship.nyc
git fetch origin
git checkout main
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations if needed
# docker-compose exec backend python -m alembic upgrade head

echo "Production deployment complete!"
```

Make it executable:
```bash
chmod +x deploy-production.sh
```

## Deployment Workflow

### Daily Development

1. **Work on feature branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   # Make changes
   git add .
   git commit -m "Add feature X"
   git push origin feature/my-feature
   ```

2. **Test locally**:
   ```bash
   docker-compose up -d
   # Test your changes
   ```

3. **Merge to develop**:
   ```bash
   git checkout develop
   git merge feature/my-feature
   git push origin develop
   ```

4. **Deploy to dev/stage** (automated or manual):
   ```bash
   # On dev server
   ./deploy-dev.sh
   ```

### Production Release

1. **Merge develop → main**:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Deploy to VPS**:
   ```bash
   # On VPS
   ./deploy-production.sh
   ```

## Automated Deployment (Optional)

### GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /path/to/ship.nyc
            git pull origin main
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
```

## Environment Configuration

### Development (.env.development)
```env
NEXT_PUBLIC_API_URL=https://dev.mailbackend.oathone.com/api
NEXT_PUBLIC_ENV=development
NODE_ENV=development
```

### Production (.env.production)
```env
NEXT_PUBLIC_API_URL=https://mailbackend.oathone.com/api
NEXT_PUBLIC_ENV=production
NODE_ENV=production
```

## Quick Commands

### Local Development
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Dev/Stage Deployment
```bash
# Start dev services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# View dev logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### Production Deployment
```bash
# On VPS
./deploy-production.sh
```

## Troubleshooting Dev/Stage

If dev/stage didn't work, **run the fix script first**:

```powershell
.\fix-dev-stage.ps1
```

This script will automatically:
- Check SSL certificates
- Ensure Docker network exists
- Start MongoDB
- Start dev services
- Test endpoints

### Manual Troubleshooting

See `TROUBLESHOOT-DEV-STAGE.md` for detailed troubleshooting guide.

Quick checks:

1. **SSL Certificates**:
   ```bash
   ls -la certs/
   # Should have localhost.pem and localhost-key.pem
   ```

2. **Ports Available**:
   ```bash
   # Windows
   netstat -ano | findstr "9445 9446"
   
   # Linux
   netstat -tuln | grep -E '9445|9446'
   ```

3. **Docker Services Running**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
   # Should show backend-dev and frontend-dev running
   ```

4. **Network Connectivity**:
   ```bash
   # Windows PowerShell
   Invoke-WebRequest -Uri "https://192.168.8.199:9445" -SkipCertificateCheck
   Invoke-WebRequest -Uri "https://192.168.8.199:9446/api/health" -SkipCertificateCheck
   
   # Linux
   curl -k https://192.168.8.199:9445
   curl -k https://192.168.8.199:9446/api/health
   ```

## Best Practices

1. **Always test on dev/stage before production**
2. **Use feature branches for new features**
3. **Keep `main` branch stable**
4. **Document breaking changes**
5. **Use semantic versioning for releases**
6. **Backup database before major deployments**

