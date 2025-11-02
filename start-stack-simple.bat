@echo off
setlocal

echo ========================================
echo InterShip Start Backend + Frontend
echo ========================================
echo.

echo Starting with HTTPS support...
set REACT_APP_API_URL=https://mailbackend.oathone.com:7000/api
set HTTPS=true

echo Using API URL: %REACT_APP_API_URL%
echo.

rem Start backend in a new window
start "InterShip Backend" cmd /c "Y:\proj2\run-backend.bat"

rem Small delay to allow API to bind ports
timeout /t 2 /nobreak >nul

rem Start frontend in a new window
start "InterShip Frontend" cmd /c "Y:\proj2\run-frontend.bat"

echo.
echo ========================================
echo Stack Started Successfully!
echo ========================================
echo Frontend: https://localhost:3000
echo Backend API: https://mailbackend.oathone.com:7000/api
echo.

endlocal
exit /b 0


