# Enable HTTPS - Quick Guide

## Step 1: Generate SSL Certificates

You have two options:

### Option A: Using mkcert (Recommended)
```powershell
# Install mkcert (if not installed)
choco install mkcert
# or: scoop install mkcert

# Install certificate authority
mkcert -install

# Generate certificates
cd certs
mkcert localhost 127.0.0.1 ::1 192.168.8.199 0.0.0.0
# Rename files
move localhost+4.pem localhost.pem
move localhost+4-key.pem localhost-key.pem
cd ..
```

### Option B: Using PowerShell (Self-signed)
```powershell
# Run as Administrator
.\generate-ssl-certs.ps1

# Then convert PFX to PEM (requires OpenSSL):
# openssl pkcs12 -in certs/localhost.pfx -nocerts -nodes -out certs/localhost-key.pem
# openssl pkcs12 -in certs/localhost.pfx -clcerts -nokeys -out certs/localhost.pem
```

## Step 2: Start with HTTPS

```powershell
docker-compose up -d
```

## Step 3: Access the Application

- **Frontend HTTPS**: `https://localhost:8080` (when certificates are present)
- **Frontend HTTP**: `http://localhost:8080` (fallback)
- **Backend HTTPS**: `https://localhost:8443/api` (when certificates are present)
- **Backend HTTP**: `http://localhost:8000/api` (fallback)

## Note

- The application will automatically use HTTPS if certificates are found in `./certs/`
- If certificates are not found, it falls back to HTTP
- You may need to accept the self-signed certificate warning in your browser
- For network access: Use `https://192.168.8.199:8080` (certificate must include this IP)

