@echo off
setlocal

echo ========================================
echo InterShip Backend Runner
echo ========================================
echo.

rem 1) Verify .NET SDK
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
  echo .NET SDK not found on PATH. Please install .NET 8 SDK and retry.
  start "" https://dotnet.microsoft.com/en-us/download/dotnet/8.0
  goto :eof
)

rem 2) Kill any running InterShip.Api to avoid file locks
taskkill /IM InterShip.Api* /F >nul 2>nul

rem 3) Build solution (optional but helpful after code changes)
echo Building solution...
dotnet build >nul
if %errorlevel% neq 0 (
  echo Build failed. Please fix errors and rerun.
  goto :eof
)

rem 4) Run API on HTTP 5000 and HTTPS 7000
echo Starting API at http://localhost:5000 and https://localhost:7000 ...
pushd InterShip.Api
dotnet run --urls "http://localhost:5000;https://localhost:7000"
popd

endlocal
exit /b 0


