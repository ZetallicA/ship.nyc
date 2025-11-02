@echo off
setlocal

echo ========================================
echo InterShip Frontend Runner
echo ========================================
echo.

rem 1) Verify Node.js and npm
where node >nul 2>nul
if %errorlevel% neq 0 (
  rem Try common install locations and temporarily add to PATH
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
  if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
  if defined NVM_SYMLINK if exist "%NVM_SYMLINK%\node.exe" set "PATH=%NVM_SYMLINK%;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 goto no_node

where npm >nul 2>nul
if %errorlevel% neq 0 (
  rem npm should be next to node.exe; try adding again
  if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
  if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)
where npm >nul 2>nul
if %errorlevel% neq 0 goto no_npm

rem 2) Set API URL if not provided by caller
if not defined REACT_APP_API_URL set REACT_APP_API_URL=http://localhost:5000/api
echo Using REACT_APP_API_URL=%REACT_APP_API_URL%

rem 3) Install dependencies if needed
pushd InterShip.Client
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install --no-fund --no-audit || goto install_failed
)

rem 4) Start React dev server with HTTPS support if requested
if "%HTTPS%"=="true" (
    echo Starting React development server on https://0.0.0.0:3000 ...
    echo This will be accessible on both localhost and network IP
    set HTTPS=true
    set HOST=0.0.0.0
    call npm start
) else (
    echo Starting React development server on http://localhost:3000 ...
    call npm start
)
popd
goto :eof

:no_node
echo Node.js is not installed. Please install it first.
echo Download (LTS): https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
start "" https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
goto :eof

:no_npm
echo npm is not available on PATH. Please reinstall Node.js (LTS) and try again.
goto :eof

:install_failed
echo npm install failed. Please check the errors above.
popd
goto :eof


