# HTTPS Setup for Docker Deployment

## Overview
This guide explains how to enable HTTPS for the InterShip application running in Docker.

## Prerequisites
- Docker and Docker Compose installed
- `mkcert` installed (recommended) or `openssl` for certificate generation

## Quick Setup

1. **Generate SSL Certificates**
   ```powershell
   .\setup-https-docker.ps1
   ```
   
   Or manually with mkcert:
   ```powershell
   mkcert -install
   mkdir certs
   cd certs
   mkcert localhost 127.0.0.1 ::1 192.168.8.199 0.0.0.0
   mv localhost+4.pem localhost.pem
   mv localhost+4-key.pem localhost-key.pem
   ```

2. **Start the Application**
   ```powershell
   docker-compose up -d
   ```

3. **Access the Application**
   - Frontend HTTPS: `https://localhost:8080`
   - Backend HTTPS: `https://localhost:8443/api`
   - Frontend HTTP (fallback): `http://localhost:8080`
   - Backend HTTP (fallback): `http://localhost:8000/api`

## Port Configuration

- **Frontend HTTP**: Port 8080
- **Frontend HTTPS**: Port 8080 (Next.js serves both)
- **Backend HTTP**: Port 8000
- **Backend HTTPS**: Port 8443

## Certificate Files

Certificates should be placed in the `./certs` directory:
- `localhost.pem` - Certificate file
- `localhost-key.pem` - Private key file

## Troubleshooting

### Browser Security Warning
Browsers will show a security warning for self-signed certificates. This is normal for development:
- Click "Advanced"
- Click "Proceed to localhost (unsafe)"

### Certificate Not Found
If you see certificate errors:
1. Ensure certificates exist in `./certs/` directory
2. Check file permissions (should be readable)
3. Regenerate certificates using `setup-https-docker.ps1`

### Port Already in Use
If port 8443 is already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8443:8443"  # Change first number to available port
```

## Network Access

To access from other devices on your network:
- Use `https://192.168.8.199:8080` (your machine's IP)
- You'll need to install the certificate on each device, or use a reverse proxy with valid certificates

## Production Deployment

For production, use:
- Valid SSL certificates from a Certificate Authority (Let's Encrypt, etc.)
- A reverse proxy (nginx, Traefik, etc.) to handle SSL termination
- Update CORS origins to only include your production domain

