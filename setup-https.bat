@echo off
setlocal

echo ========================================
echo InterShip HTTPS Setup
echo ========================================
echo.

echo This script will:
echo 1. Generate SSL certificates for development
echo 2. Start the InterShip stack with HTTPS
echo.

echo Step 1: Generating SSL certificates...
echo Please run PowerShell as Administrator and execute:
echo.
echo   cd Y:\proj2
echo   .\generate-ssl-certs.ps1
echo.
echo After generating certificates, press any key to continue...
pause

echo.
echo Step 2: Starting InterShip with HTTPS...
call start-https-network.bat

endlocal
exit /b 0


