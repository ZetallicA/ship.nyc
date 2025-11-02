@echo off
setlocal

echo ========================================
echo InterShip Start Backend + Frontend
echo ========================================
echo.

rem Check if HTTPS is requested
set HTTPS_MODE=%1
if "%HTTPS_MODE%"=="https" (
    echo Starting with HTTPS support...
    set REACT_APP_API_URL=https://localhost:7000/api
    set HTTPS=true
) else (
    echo Starting with HTTP (default)...
    set REACT_APP_API_URL=http://localhost:5000/api
    set HTTPS=false
)

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
if "%HTTPS_MODE%"=="https" (
    echo Frontend: https://localhost:3000
    echo Backend API: https://localhost:7000/api
) else (
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:5000/api
)
echo.
echo To start with HTTPS, run: start-stack.bat https
echo.

endlocal
exit /b 0



