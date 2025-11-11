# Cloudflare Tunnel Configuration for Dev/Stage Environment

## Current Production Setup

### Production Routes
- **Frontend**: `mail.oathone.com` → `https://192.168.8.199:9444`
- **Backend**: `mailbackend.oathone.com` → `https://192.168.8.199:9443`

## Recommended Dev/Stage Setup

### Option 1: Use Different Ports (Recommended)
If you're running dev/stage on the same server with different ports:

- **Frontend Dev**: `dev.mail.oathone.com` → `https://192.168.8.199:9445`
- **Backend Dev**: `dev.mailbackend.oathone.com` → `https://192.168.8.199:9446`

**Note**: You'll need to update your `docker-compose.yml` to expose these ports for dev/stage containers.

### Option 2: Use Same Ports with Different Containers
If you have separate dev/stage containers running on different internal ports:

- **Frontend Dev**: `dev.mail.oathone.com` → `https://192.168.8.199:9445` (or whatever port your dev frontend uses)
- **Backend Dev**: `dev.mailbackend.oathone.com` → `https://192.168.8.199:9444` (or whatever port your dev backend uses)

## Cloudflare Tunnel Configuration

### Add These Routes in Cloudflare Dashboard

1. **dev.mail.oathone.com** (Frontend)
   - **Path**: `*` (catch-all)
   - **Service**: `https://192.168.8.199:9445`
   - **Origin configurations**: `https://192.168.8.199:9445`

2. **dev.mailbackend.oathone.com** (Backend)
   - **Path**: `*` (catch-all)
   - **Service**: `https://192.168.8.199:9446`
   - **Origin configurations**: `https://192.168.8.199:9446`

## Docker Compose for Dev/Stage

If you want to run dev/stage alongside production, you'll need a separate `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend-dev:
    # ... same as production but with different ports
    ports:
      - "8001:8000"  # HTTP port (dev)
      - "9446:8443"  # HTTPS port (dev)
    container_name: intership-backend-dev
    # ... rest of config

  frontend-dev:
    # ... same as production but with different ports
    ports:
      - "8081:3000"  # HTTP port (dev)
      - "9445:3443"  # HTTPS port (dev)
    container_name: intership-frontend-dev
    # ... rest of config
```

## Quick Setup Steps

1. **Ensure SSL Certificates Exist**:
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

2. **Start Dev/Stage Services**:
   ```powershell
   .\start-dev-environment.ps1
   ```
   Or manually:
   ```powershell
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

3. **Add Cloudflare Routes**:
   - Go to Cloudflare Dashboard → Networks → Tunnels
   - Click "+ Add a published application route"
   - Add `dev.mail.oathone.com` → `https://192.168.8.199:9445`
   - Add `dev.mailbackend.oathone.com` → `https://192.168.8.199:9446`

4. **Verify**:
   - Visit `https://dev.mail.oathone.com` - should load frontend
   - Visit `https://dev.mailbackend.oathone.com/api/health` - should return `{"status": "healthy"}`

## Important Notes

- All routes must use **HTTPS** (as you specified)
- Make sure ports 9445 and 9446 are not in use by other services
- If you're using the same containers for both environments, you'll need to use different ports
- The frontend will automatically detect `dev.mail.oathone.com` and route to `dev.mailbackend.oathone.com` for API calls

