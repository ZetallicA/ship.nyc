@echo off
setlocal

echo ========================================
echo InterShip Production Startup
echo ========================================
echo.

rem Set environment variables for production
set REACT_APP_API_URL=https://mailbackend.oathone.com/api
set HTTPS=true
set HOST=0.0.0.0

echo Configuration:
echo   - Frontend: https://mail.oathone.com
echo   - Backend: https://mailbackend.oathone.com/api
echo   - API URL: %REACT_APP_API_URL%
echo.

echo Starting backend...
start "InterShip Backend Production" cmd /c "cd Y:\proj2\InterShip.Api && dotnet run --urls "https://0.0.0.0:7000""

rem Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend...
start "InterShip Frontend Production" cmd /c "cd Y:\proj2\InterShip.Client && set REACT_APP_API_URL=%REACT_APP_API_URL% && set HTTPS=%HTTPS% && set HOST=%HOST% && npm start"

echo.
echo ========================================
echo Production Stack Started Successfully!
echo ========================================
echo.
echo Access URLs:
echo   Frontend: https://mail.oathone.com
echo   Backend API: https://mailbackend.oathone.com/api
echo.
echo Note: Make sure your Cloudflare tunnel is running
echo       and the tunnel routes are configured correctly.
echo.

endlocal
exit /b 0


