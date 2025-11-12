@echo off
echo ========================================
echo InterShip Frontend Setup
echo ========================================
echo.

echo Step 1: Installing Node.js and npm...
echo Please download and install Node.js from: https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
echo After installation, restart this script.
echo.
pause

echo Step 2: Verifying Node.js installation...
node --version
npm --version
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install it first.
    pause
    exit /b 1
)

echo Step 3: Installing React dependencies...
cd InterShip.Client
npm install

echo Step 4: Starting React development server...
echo The React app will be available at http://localhost:3000
echo The API is available at https://localhost:7000/swagger
echo.
npm start

pause













