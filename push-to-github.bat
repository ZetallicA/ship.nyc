@echo off
REM Push to GitHub - InterShip Project
REM Repository: https://github.com/ZetallicA/ship.nyc

echo ========================================
echo Pushing to GitHub: ship.nyc
echo ========================================
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    git init
    git remote add origin https://github.com/ZetallicA/ship.nyc.git
    echo.
)

REM Check current branch
git branch --show-current >nul 2>&1
if errorlevel 1 (
    echo Creating main branch...
    git checkout -b main
    echo.
)

REM Add all files
echo Adding files to staging...
git add .
echo.

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    echo Enter commit message (or press Enter for default):
    set /p commit_message="Commit message: "
    if "%commit_message%"=="" set commit_message=Update project files
    
    echo.
    echo Committing changes...
    git commit -m "%commit_message%"
    echo.
) else (
    echo No changes to commit.
    echo.
)

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo Push failed. Attempting to set upstream...
    git push --set-upstream origin main
)

echo.
echo ========================================
echo Done!
echo ========================================
pause

