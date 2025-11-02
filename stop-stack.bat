@echo off
setlocal

echo ========================================
echo InterShip Stop Backend + Frontend
echo ========================================
echo.

rem Stop backend by image name (ignore errors if not running)
taskkill /IM InterShip.Api* /F >nul 2>nul

rem Stop common Node/react dev-server processes
taskkill /IM node.exe /F >nul 2>nul
taskkill /IM react-scripts* /F >nul 2>nul

echo Done.
endlocal
exit /b 0


