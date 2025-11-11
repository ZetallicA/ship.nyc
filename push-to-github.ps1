# PowerShell script to push to GitHub
# Repository: https://github.com/ZetallicA/ship.nyc
# GitHub Username: rabi.hamsi@gmail.com

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing to GitHub: OATH Logistics (ship.nyc repository)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/ZetallicA/ship.nyc.git
    Write-Host ""
}

# Check current branch
$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    Write-Host "Creating main branch..." -ForegroundColor Yellow
    git checkout -b main
    Write-Host ""
}

# Configure git user if not set
$gitUser = git config user.email 2>$null
if (-not $gitUser) {
    Write-Host "Configuring git user..." -ForegroundColor Yellow
    git config user.email "rabi.hamsi@gmail.com"
    git config user.name "ZetallicA"
    Write-Host ""
}

# Add all files
Write-Host "Adding files to staging..." -ForegroundColor Yellow
git add .
Write-Host ""

# Check if there are changes to commit
$status = git diff --cached --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Enter commit message (or press Enter for default):" -ForegroundColor Yellow
    $commitMessage = Read-Host "Commit message"
    
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        # Generate automatic commit message
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Update project files - $timestamp"
    }
    
    Write-Host ""
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMessage
    Write-Host ""
} else {
    Write-Host "No changes to commit." -ForegroundColor Green
    Write-Host ""
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. Attempting to set upstream..." -ForegroundColor Yellow
    git push --set-upstream origin main
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

