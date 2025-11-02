# Download mkcert manually without requiring admin
$ErrorActionPreference = "Stop"

Write-Host "Downloading mkcert manually..." -ForegroundColor Cyan

# Create bin directory if it doesn't exist
$binDir = ".\bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

# Download mkcert
$mkcertUrl = "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe"
$mkcertPath = Join-Path $binDir "mkcert.exe"

Write-Host "Downloading from: $mkcertUrl" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $mkcertUrl -OutFile $mkcertPath -UseBasicParsing
    Write-Host "Downloaded mkcert to: $mkcertPath" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Make it executable
Write-Host "Setting up mkcert..." -ForegroundColor Cyan

# Now use the local mkcert
$env:Path = "$PWD\bin;$env:Path"
$localMkcert = Join-Path $PWD "bin\mkcert.exe"

if (Test-Path $localMkcert) {
    Write-Host "mkcert is ready at: $localMkcert" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: mkcert -install requires admin rights." -ForegroundColor Yellow
    Write-Host "For development, we'll generate certificates without installing CA." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Failed to download mkcert" -ForegroundColor Red
    exit 1
}

