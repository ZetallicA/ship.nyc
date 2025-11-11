@echo off
REM Start Dev/Stage Environment with HTTPS
REM This starts dev services on ports 9445 (frontend) and 9446 (backend)

echo ========================================
echo Starting Dev/Stage Environment
echo ========================================
echo.

REM Check if certificates exist
if not exist "certs\localhost.pem" (
    echo WARNING: SSL certificates not found!
    echo HTTPS will not work. Run setup-https-docker.ps1 first.
    echo.
    pause
)

REM Check if production network exists
docker network inspect intership-network >nul 2>&1
if errorlevel 1 (
    echo Creating intership-network...
    docker network create intership-network
    echo.
)

REM Start dev services
echo Starting dev services...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo.
echo ========================================
echo Dev/Stage Environment Started!
echo ========================================
echo.
echo Frontend Dev: https://192.168.8.199:9445
echo Backend Dev:  https://192.168.8.199:9446
echo.
echo Cloudflare Routes:
echo   dev.mail.oathone.com -> https://192.168.8.199:9445
echo   dev.mailbackend.oathone.com -> https://192.168.8.199:9446
echo.
pause

