# Network Access Configuration

## Accessing the Application via IP Address

The application is now configured to be accessible via your machine's IP address on the local network.

### Your Machine IP
Based on your network configuration: **192.168.8.199**

### Access URLs
- **Frontend**: `http://192.168.8.199:3000`
- **Backend API**: `http://192.168.8.199:8000/api`

### Configuration Changes Made

1. **Next.js Frontend** (`frontend/package.json`):
   - Updated dev script to bind to `0.0.0.0`: `next dev -H 0.0.0.0`
   - This allows access from any network interface

2. **FastAPI Backend** (`backend/main.py`):
   - Already configured to bind to `0.0.0.0:8000` in docker-compose.yml
   - CORS updated to accept IP-based origins

3. **CORS Configuration** (`docker-compose.yml`):
   - Added IP address to allowed origins: `http://192.168.8.199:3000`

### Testing Network Access

1. **From the same machine**: Use `http://localhost:3000` or `http://192.168.8.199:3000`
2. **From another device on the same network**: Use `http://192.168.8.199:3000`

### Firewall Considerations

If you cannot access from other devices, ensure:
- Windows Firewall allows inbound connections on ports 3000 and 8000
- Or temporarily disable firewall for testing

### Finding Your IP Address

Run this PowerShell command:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1 -ExpandProperty IPAddress
```

