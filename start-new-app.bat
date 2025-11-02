@echo off
echo Stopping any existing services on ports 3000 and 8000...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo.
echo Starting InterShip application with Docker Compose...
echo.

docker-compose up --build

