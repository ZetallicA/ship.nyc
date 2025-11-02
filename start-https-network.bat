@echo off
setlocal

echo ========================================
echo InterShip HTTPS + Network Access Setup
echo ========================================
echo.

rem Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :ip_found
    )
)
:ip_found

echo Local IP Address: %LOCAL_IP%
echo.

rem Set environment variables for HTTPS
set REACT_APP_API_URL=https://%LOCAL_IP%:7000/api
set HTTPS=true
set HOST=0.0.0.0

echo Configuration:
echo   - Frontend: https://%LOCAL_IP%:3000 (network) / https://localhost:3000 (local)
echo   - Backend: https://%LOCAL_IP%:7000/api
echo   - API URL: %REACT_APP_API_URL%
echo.

rem Check if certificates exist
if not exist "Y:\proj2\certs\localhost.crt" (
    echo SSL certificates not found!
    echo Please run generate-ssl-certs.ps1 as Administrator first.
    echo.
    pause
    exit /b 1
)

echo Starting backend with HTTPS support...
start "InterShip Backend HTTPS" cmd /c "cd Y:\proj2\InterShip.Api && dotnet run --urls "http://0.0.0.0:5000;https://0.0.0.0:7000""

rem Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend with HTTPS and network access...
start "InterShip Frontend HTTPS" cmd /c "cd Y:\proj2\InterShip.Client && set HTTPS=true && set HOST=0.0.0.0 && set REACT_APP_API_URL=%REACT_APP_API_URL% && npm start"

echo.
echo ========================================
echo Stack Started Successfully!
echo ========================================
echo.
echo Access URLs:
echo   Local:  https://localhost:3000
echo   Network: https://%LOCAL_IP%:3000
echo   API: https://%LOCAL_IP%:7000/api
echo.
echo Note: You may need to accept SSL certificates in your browser
echo       for the first time access.
echo.

endlocal
exit /b 0


