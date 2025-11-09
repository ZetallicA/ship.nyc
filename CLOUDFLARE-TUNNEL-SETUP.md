# Cloudflare Tunnel Setup for InterShip

This guide will help you configure Cloudflare tunnels to make InterShip accessible via your custom domains.

## Prerequisites

- Cloudflare account
- Cloudflare tunnel running on your server
- Domains: `mail.oathone.com` and `mailbackend.oathone.com`

## 1. Cloudflare Tunnel Records

### Frontend (mail.oathone.com)
```
Type: CNAME
Name: mail
Content: your-tunnel-id.cfargotunnel.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

### Backend (mailbackend.oathone.com)
```
Type: CNAME
Name: mailbackend
Content: your-tunnel-id.cfargotunnel.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

## 2. Cloudflare Tunnel Configuration

### Create tunnel config file: `config.yml`

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  # Frontend - Next.js App (Docker)
  - hostname: mail.oathone.com
    service: https://192.168.8.199:9444
    originRequest:
      httpHostHeader: 192.168.8.199:9444
      noTLSVerify: true
  
  # Backend API - FastAPI (Docker)
  - hostname: mailbackend.oathone.com
    service: https://192.168.8.199:9443
    originRequest:
      httpHostHeader: 192.168.8.199:9443
      noTLSVerify: true
  
  # Catch-all rule (must be last)
  - service: http_status:404
```

## 3. Update Frontend Configuration

### Update API endpoints to use production URLs:

**File: `InterShip.Client/src/services/api.js`**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mailbackend.oathone.com/api';
```

**File: `InterShip.Client/src/components/Login.js`**
```javascript
const response = await fetch('https://mailbackend.oathone.com/api/auth/login', {
```

**File: `InterShip.Client/src/components/Register.js`**
```javascript
const response = await fetch('https://mailbackend.oathone.com/api/auth/register', {
```

**File: `InterShip.Client/src/components/UserSettings.js`**
```javascript
const response = await fetch('https://mailbackend.oathone.com/api/auth/change-password', {
```

## 4. Environment Variables for Production

### Create `.env.production` file:
```env
REACT_APP_API_URL=https://mailbackend.oathone.com/api
HTTPS=true
HOST=0.0.0.0
```

## 5. Backend Configuration Updates

### Update CORS policy in `InterShip.Api/Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowProduction", policy =>
    {
        policy.WithOrigins(
                "https://mail.oathone.com",
                "https://localhost:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Use the production CORS policy
app.UseCors("AllowProduction");
```

## 6. SSL Certificate Configuration

### For Production, you'll need proper SSL certificates:

1. **Option A: Let Cloudflare handle SSL**
   - Set Cloudflare SSL/TLS mode to "Full (strict)"
   - Cloudflare will handle SSL termination

2. **Option B: Use your own certificates**
   - Generate certificates for your domains
   - Update backend to use production certificates

## 7. Start Commands for Production

### Backend:
```bash
cd Y:\proj2\InterShip.Api
dotnet run --urls "https://0.0.0.0:7000"
```

### Frontend:
```bash
cd Y:\proj2\InterShip.Client
set REACT_APP_API_URL=https://mailbackend.oathone.com/api
set HTTPS=true
set HOST=0.0.0.0
npm start
```

## 8. Cloudflare Tunnel Commands

### Start tunnel:
```bash
cloudflared tunnel run your-tunnel-name
```

### Or run as service:
```bash
cloudflared tunnel service install
```

## 9. DNS Records Summary

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | mail | your-tunnel-id.cfargotunnel.com | Proxied |
| CNAME | mailbackend | your-tunnel-id.cfargotunnel.com | Proxied |

## 10. Testing

### After setup, test these URLs:
- **Frontend**: `https://mail.oathone.com`
- **Backend API**: `https://mailbackend.oathone.com/api`
- **API Health**: `https://mailbackend.oathone.com/api/officelocations`

## 11. Troubleshooting

### Common Issues:

1. **Mixed Content Errors**
   - Ensure all API calls use HTTPS
   - Check that backend is configured for HTTPS

2. **CORS Errors**
   - Update CORS policy to include your domains
   - Ensure backend allows your frontend domain

3. **SSL Certificate Issues**
   - Use Cloudflare's SSL termination
   - Or configure proper certificates

4. **Tunnel Connection Issues**
   - Check tunnel status: `cloudflared tunnel list`
   - Verify credentials file
   - Check firewall settings

## 12. Security Considerations

- Use Cloudflare's security features (DDoS protection, WAF)
- Enable Cloudflare Access for additional security
- Consider using Cloudflare Zero Trust for authentication
- Monitor traffic and set up alerts

## 13. Performance Optimization

- Enable Cloudflare caching
- Use Cloudflare's CDN features
- Optimize images and assets
- Enable compression

This setup will make your InterShip application accessible via your custom domains with proper SSL encryption and Cloudflare's security features.


