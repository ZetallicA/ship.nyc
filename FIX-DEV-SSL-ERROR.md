# Fix SSL Error for dev.mail.oathone.com

## Problem
`ERR_SSL_VERSION_OR_CIPHER_MISMATCH` when accessing `https://dev.mail.oathone.com`

## Root Cause
The Cloudflare tunnel is likely configured incorrectly. It needs to:
1. Point to the correct ports (9445 for frontend, 9446 for backend)
2. Use HTTPS (not HTTP) to connect to your services
3. Handle self-signed certificates properly

## Solution

### Step 1: Verify Services Are Running

✅ **Services are running:**
- Frontend dev: Port 9445 (HTTPS) ✅
- Backend dev: Port 9446 (HTTPS) ✅

### Step 2: Configure Cloudflare Tunnel

Go to **Cloudflare Dashboard → Networks → Tunnels** and configure:

#### For `dev.mail.oathone.com` (Frontend):

**Route Configuration:**
- **Subdomain**: `dev.mail.oathone.com`
- **Path**: `*` (catch-all)
- **Service**: `https://192.168.8.199:9445`
- **Origin Server Name**: Leave empty or set to `dev.mail.oathone.com`

**Important Settings:**
- ✅ **Use HTTPS** (not HTTP)
- ✅ **No TLS Verify** (since you're using self-signed certificates)
- ✅ **No Proxy** (if you want direct connection)

#### For `dev.mailbackend.oathone.com` (Backend):

**Route Configuration:**
- **Subdomain**: `dev.mailbackend.oathone.com`
- **Path**: `*` (catch-all)
- **Service**: `https://192.168.8.199:9446`
- **Origin Server Name**: Leave empty or set to `dev.mailbackend.oathone.com`

**Important Settings:**
- ✅ **Use HTTPS** (not HTTP)
- ✅ **No TLS Verify** (since you're using self-signed certificates)

### Step 3: Cloudflare Tunnel Settings

In your Cloudflare tunnel configuration, you may need to:

1. **Enable "No TLS Verify"** for self-signed certificates
2. **Set "Origin Server Name"** to match your certificate (or leave empty)
3. **Use HTTPS** for the service URL

### Step 4: Alternative - Use HTTP with Cloudflare SSL

If HTTPS to origin is causing issues, you can:

1. **Configure Cloudflare to use HTTP** to your origin:
   - Service: `http://192.168.8.199:8081` (frontend HTTP)
   - Service: `http://192.168.8.199:8001` (backend HTTP)
   
2. **Let Cloudflare handle SSL termination** (Cloudflare → Your server = HTTP, Browser → Cloudflare = HTTPS)

**This is actually the recommended approach** for development environments!

### Recommended Configuration (HTTP to Origin)

#### For `dev.mail.oathone.com`:
- **Service**: `http://192.168.8.199:8081`
- **Cloudflare SSL**: Full (strict) or Flexible

#### For `dev.mailbackend.oathone.com`:
- **Service**: `http://192.168.8.199:8001`
- **Cloudflare SSL**: Full (strict) or Flexible

## Quick Fix Steps

1. **Open Cloudflare Dashboard**
2. **Go to Networks → Tunnels**
3. **Find your tunnel** (the one handling oathone.com)
4. **Click "Configure"**
5. **Add/Edit route for `dev.mail.oathone.com`:**
   - Service: `http://192.168.8.199:8081` (HTTP, not HTTPS!)
   - Path: `*`
6. **Add/Edit route for `dev.mailbackend.oathone.com`:**
   - Service: `http://192.168.8.199:8001` (HTTP, not HTTPS!)
   - Path: `*`
7. **Save and wait 30 seconds** for changes to propagate

## Why This Works

- **Cloudflare handles SSL** between browser and Cloudflare (HTTPS)
- **Your server uses HTTP** internally (simpler, no certificate issues)
- **No SSL mismatch** because Cloudflare doesn't verify your self-signed certs

## Verify It's Working

After updating Cloudflare:

1. Wait 30-60 seconds for changes to propagate
2. Visit `https://dev.mail.oathone.com` (should load without SSL error)
3. Visit `https://dev.mailbackend.oathone.com/api/health` (should return `{"status": "healthy"}`)

## Current Status

✅ Services are running correctly
✅ Ports 9445 and 9446 are listening
✅ HTTPS is working on the services
❌ Cloudflare tunnel needs to be configured

**Next Step**: Update Cloudflare tunnel configuration as described above.


