# InterShip HTTPS Setup

## Overview
The InterShip system now supports both HTTP and HTTPS modes for secure development and production environments.

## Usage

### HTTP Mode (Default)
```bash
start-stack.bat
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### HTTPS Mode
```bash
start-stack.bat https
```
or
```bash
start-stack-https.bat
```
- Frontend: https://localhost:3000
- Backend API: https://localhost:7000/api

## Features

### Backend HTTPS Support
- The ASP.NET Core API automatically supports HTTPS on port 7000
- CORS is configured to allow both HTTP and HTTPS origins
- SSL certificates are automatically generated for development

### Frontend HTTPS Support
- React development server supports HTTPS with automatic certificate generation
- Environment variables are automatically set for the correct API URL
- Mixed content issues are resolved with proper HTTPS configuration

## Security Benefits

1. **Encrypted Communication**: All data between frontend and backend is encrypted
2. **Secure Cookies**: HTTPS enables secure cookie transmission
3. **Mixed Content Prevention**: Prevents security warnings in browsers
4. **Production Ready**: HTTPS configuration matches production environments

## Development Notes

- HTTPS certificates are automatically generated for localhost
- Browser may show security warnings for self-signed certificates (click "Advanced" → "Proceed")
- All API calls are automatically routed to the correct HTTPS endpoint
- CORS is properly configured for both HTTP and HTTPS origins

## Troubleshooting

### Certificate Issues
If you encounter certificate errors:
1. Click "Advanced" in your browser
2. Click "Proceed to localhost (unsafe)"
3. The certificate is automatically generated for development

### Port Conflicts
If ports 3000, 5000, or 7000 are in use:
- Check for other running applications
- Use `netstat -an | findstr :3000` to check port usage
- Restart the stack if needed

### API Connection Issues
- Ensure the backend is running on the correct port (5000 for HTTP, 7000 for HTTPS)
- Check that CORS is properly configured
- Verify the REACT_APP_API_URL environment variable is set correctly


