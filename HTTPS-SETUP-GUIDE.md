# InterShip HTTPS + Network Access Setup Guide

This guide will help you set up InterShip with HTTPS support for both local and network access.

## Prerequisites

- Windows 10/11
- Node.js (LTS version)
- .NET 8 SDK
- PowerShell (for certificate generation)

## Quick Start

### Option 1: Automated Setup (Recommended)

1. **Generate SSL Certificates** (Run as Administrator):
   ```powershell
   cd Y:\proj2
   .\generate-ssl-certs.ps1
   ```

2. **Start the Stack**:
   ```cmd
   start-https-network.bat
   ```

### Option 2: Manual Setup

1. **Generate SSL Certificates**:
   - Open PowerShell as Administrator
   - Navigate to project directory: `cd Y:\proj2`
   - Run: `.\generate-ssl-certs.ps1`
   - Follow the prompts to generate certificates

2. **Trust the Certificate** (Important for HTTPS):
   - Open Certificate Manager: `certlm.msc`
   - Navigate to "Trusted Root Certification Authorities" > "Certificates"
   - Import the generated `localhost.pfx` file
   - Password: `intership123`

3. **Start Backend**:
   ```cmd
   cd Y:\proj2\InterShip.Api
   dotnet run --urls "http://0.0.0.0:5000;https://0.0.0.0:7000"
   ```

4. **Start Frontend** (in new terminal):
   ```cmd
   cd Y:\proj2\InterShip.Client
   set HTTPS=true
   set HOST=0.0.0.0
   set REACT_APP_API_URL=https://YOUR_IP:7000/api
   npm start
   ```

## Access URLs

After setup, you can access InterShip at:

- **Local Access**: `https://localhost:3000`
- **Network Access**: `https://YOUR_IP:3000`
- **API**: `https://YOUR_IP:7000/api`

## Troubleshooting

### Certificate Issues

If you get certificate errors:

1. **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
2. **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
3. **Trust Certificate**: Import the certificate into Windows Certificate Store

### Port Issues

If ports are in use:

1. **Kill existing processes**:
   ```cmd
   taskkill /f /im node.exe
   taskkill /f /im dotnet.exe
   ```

2. **Check ports**:
   ```cmd
   netstat -an | findstr :3000
   netstat -an | findstr :7000
   ```

### Network Access Issues

1. **Check Windows Firewall**: Allow Node.js and .NET through firewall
2. **Check IP Address**: Run `ipconfig` to get your local IP
3. **Update API URL**: Make sure `REACT_APP_API_URL` uses your actual IP

## Scripts Available

- `setup-https.bat` - Complete setup with prompts
- `start-https-network.bat` - Start stack with HTTPS + network access
- `generate-ssl-certs.ps1` - Generate SSL certificates (run as Admin)
- `start-stack.bat https` - Original HTTPS script

## Security Notes

- These are **development certificates** only
- For production, use proper SSL certificates from a trusted CA
- The generated certificates are self-signed and will show security warnings
- Always accept the certificate in your browser for development

## Network Configuration

The setup automatically detects your local IP address and configures:
- Frontend: Accessible on `https://YOUR_IP:3000`
- Backend: Accessible on `https://YOUR_IP:7000`
- API calls: Automatically routed to the correct HTTPS endpoint

## File Structure

```
Y:\proj2\
├── certs/                          # SSL certificates (generated)
│   ├── localhost.crt              # Certificate file
│   └── localhost.pfx              # Certificate with private key
├── generate-ssl-certs.ps1          # Certificate generator
├── start-https-network.bat        # HTTPS + network startup
├── setup-https.bat                # Complete setup script
└── HTTPS-SETUP-GUIDE.md           # This guide
```

## Support

If you encounter issues:

1. Check that all prerequisites are installed
2. Ensure you're running PowerShell as Administrator for certificate generation
3. Verify that ports 3000 and 7000 are not in use
4. Check Windows Firewall settings
5. Make sure the backend is running before starting the frontend
