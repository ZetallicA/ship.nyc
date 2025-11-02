@echo off
setlocal

echo ========================================
echo InterShip HTTPS + Network Access
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

echo Using API URL: %REACT_APP_API_URL%
echo Frontend will be accessible at:
echo   - Local: https://localhost:3000
echo   - Network: https://%LOCAL_IP%:3000
echo.

rem Start backend in a new window with HTTPS
start "InterShip Backend HTTPS" cmd /c "cd Y:\proj2\InterShip.Api && dotnet run --urls "http://0.0.0.0:5000;https://0.0.0.0:7000""

rem Small delay to allow API to bind ports
timeout /t 3 /nobreak >nul

rem Start frontend in a new window with HTTPS and network access
start "InterShip Frontend HTTPS" cmd /c "cd Y:\proj2\InterShip.Client && set HTTPS=true && set HOST=0.0.0.0 && set REACT_APP_API_URL=%REACT_APP_API_URL% && npm start"

echo.
echo ========================================
echo Stack Started Successfully!
echo ========================================
echo Frontend (Local): https://localhost:3000
echo Frontend (Network): https://%LOCAL_IP%:3000
echo Backend API: https://%LOCAL_IP%:7000/api
echo.
echo Note: You may need to accept SSL certificates in your browser
echo.

endlocal
exit /b 0


