# Environment Configuration

This document describes the environment setup for InterShip application.

## Environments

### Production
- **Frontend URL**: https://mail.oathone.com/
- **Backend URL**: https://mailbackend.oathone.com/
- **API Endpoint**: https://mailbackend.oathone.com/api

### Development/Stage
- **Frontend URL**: https://dev.mail.oathone.com/
- **Backend URL**: https://dev.mailbackend.oathone.com/
- **API Endpoint**: https://dev.mailbackend.oathone.com/api

### Local Development
- **Frontend URL**: http://localhost:3000
- **Backend URL**: http://localhost:8000
- **API Endpoint**: http://localhost:8000/api

## Environment Variables

### Frontend (.env files)

The frontend uses Next.js environment variables. Create the appropriate `.env` file based on your environment:

#### Production (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://mailbackend.oathone.com/api
NEXT_PUBLIC_ENV=production
```

#### Development/Stage (`.env.development`)
```env
NEXT_PUBLIC_API_URL=https://dev.mailbackend.oathone.com/api
NEXT_PUBLIC_ENV=development
```

#### Local (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_ENV=local
```

## Automatic Environment Detection

The application automatically detects the environment based on the hostname:

- `mail.oathone.com` → Production (uses `mailbackend.oathone.com`)
- `dev.mail.oathone.com` → Dev/Stage (uses `dev.mailbackend.oathone.com`)
- `localhost` or IP address → Local (uses port-based URLs)

## Building for Different Environments

### Production Build
```bash
cd frontend
npm run build
# Uses .env.production if available
```

### Development Build
```bash
cd frontend
npm run dev
# Uses .env.development if available
```

## GitHub Repository

Repository: https://github.com/ZetallicA/ship.nyc

### Pushing to GitHub

Use the provided batch file:
```bash
push-to-github.bat
```

Or manually:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Notes

- Environment files (`.env.*`) are gitignored and should not be committed
- Example files (`.env.*.example`) are included for reference
- The API URL is automatically determined based on the current hostname
- Dev indicators are hidden in all environments

