# OATH Logistics Workflow - Simple Explanation

## Your Workflow (Corrected)

### ✅ Correct Understanding:
1. **Download code from GitHub** (Staging branch)
2. **Make development** locally
3. **Deploy to dev Cloudflare** (dev.mail.oathone.com) to test
4. **When happy, merge to Production branch**
5. **Deploy Production branch** to production Cloudflare (mail.oathone.com)

### ❌ What You Don't Need to Do:
- **Don't manually change Cloudflare settings in code** - The app automatically detects the environment based on the hostname!

## How It Works

### Automatic Environment Detection

The app **automatically detects** which environment it's running in based on the URL:

- **dev.mail.oathone.com** → Automatically uses `dev.mailbackend.oathone.com` for API
- **mail.oathone.com** → Automatically uses `mailbackend.oathone.com` for API

**No code changes needed!** The same code works in both environments.

### Your Workflow Steps

#### 1. Local Development (Staging Branch)

```bash
# Clone or pull Staging branch
git checkout Staging
git pull origin Staging

# Make your changes locally
# Test on localhost:8080

# Commit and push
git add .
git commit -m "Your changes"
git push origin Staging
```

#### 2. Deploy to Dev/Stage Environment

```bash
# On your dev server (or same machine)
git checkout Staging
git pull origin Staging

# Deploy to dev Cloudflare (dev.mail.oathone.com)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

**Result**: Your changes are now live at `https://dev.mail.oathone.com`

#### 3. Test on Dev/Stage

- Visit `https://dev.mail.oathone.com`
- Test all features
- Make sure everything works

#### 4. Deploy to Production

When you're happy with dev/stage:

```bash
# Merge Staging → Production
git checkout Production
git merge Staging
git push origin Production

# On your VPS (production server)
git checkout Production
git pull origin Production

# Deploy to production Cloudflare (mail.oathone.com)
docker-compose up -d --build
```

**Result**: Your changes are now live at `https://mail.oathone.com`

## Key Points

### ✅ What's Automatic:
- **Environment detection** - App knows which API to use based on hostname
- **Cloudflare routing** - Already configured in Cloudflare dashboard
- **SSL/HTTPS** - Handled by Cloudflare

### ✅ What You Control:
- **Which branch** to work on (Staging for dev, Production for prod)
- **When to deploy** (after testing on dev/stage)
- **What code** goes to production (via merge)

### ❌ What You DON'T Need to Change:
- Cloudflare URLs in code (automatic!)
- Environment variables (automatic!)
- API endpoints (automatic!)

## Branch Strategy

### Staging Branch
- **Purpose**: Development and testing
- **Deployed to**: `dev.mail.oathone.com` (dev Cloudflare)
- **Use for**: All development work, testing new features

### Production Branch
- **Purpose**: Production-ready code
- **Deployed to**: `mail.oathone.com` (production Cloudflare)
- **Use for**: Stable, tested code only

### Workflow:
```
Staging Branch → Test on dev.mail.oathone.com → Merge to Production → Deploy to mail.oathone.com
```

## Quick Commands

### Start Dev/Stage Environment
```powershell
.\fix-dev-stage.ps1
```

### Deploy Staging to Dev/Stage
```bash
git checkout Staging
git pull origin Staging
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Deploy Production to Production
```bash
git checkout Production
git pull origin Production
docker-compose up -d --build
```

## Summary

**Your workflow is correct, but remember:**
- ✅ Work on Staging branch
- ✅ Deploy Staging to dev.mail.oathone.com
- ✅ Test on dev environment
- ✅ Merge Staging → Production when ready
- ✅ Deploy Production to mail.oathone.com
- ❌ **Don't change Cloudflare settings in code** - it's automatic!

