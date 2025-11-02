@echo off
setlocal

echo ========================================
echo InterShip Local Development
echo ========================================
echo.

rem Set environment variables for local development
set REACT_APP_API_URL=https://localhost:7000/api
set HTTPS=true
set HOST=0.0.0.0

echo Configuration:
echo   - Frontend: https://localhost:3000
echo   - Backend: https://localhost:7000/api
echo   - API URL: %REACT_APP_API_URL%
echo.

echo Starting backend...
start "InterShip Backend" cmd /c "cd Y:\proj2\InterShip.Api && dotnet run --urls "http://0.0.0.0:5000;https://0.0.0.0:7000""

rem Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend...
start "InterShip Frontend" cmd /c "cd Y:\proj2\InterShip.Client && set REACT_APP_API_URL=%REACT_APP_API_URL% && set HTTPS=%HTTPS% && set HOST=%HOST% && npm start"

echo.
echo ========================================
echo Stack Started Successfully!
echo ========================================
echo.
echo Access URLs:
echo   Frontend: https://localhost:3000
echo   Backend API: https://localhost:7000/api
echo.
echo Note: You may need to accept SSL certificates in your browser
echo.

endlocal
exit /b 0


