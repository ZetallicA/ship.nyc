# Generate SSL certificates using PowerShell (no admin required)
$ErrorActionPreference = "Stop"

Write-Host "Generating SSL certificates using PowerShell..." -ForegroundColor Cyan

# Create certs directory
$certsDir = ".\certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
}

# Check if we have mkcert locally
$mkcertPath = ".\bin\mkcert.exe"
if (Test-Path $mkcertPath) {
    Write-Host "Using local mkcert..." -ForegroundColor Green
    & $mkcertPath -install 2>&1 | Out-Null
    
    Push-Location $certsDir
    & "..\$mkcertPath" localhost 127.0.0.1 192.168.8.199 0.0.0.0 2>&1
    Pop-Location
    
    # Rename files
    $certFile = Get-ChildItem "$certsDir\localhost+*.pem" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*key*" } | Select-Object -First 1
    $keyFile = Get-ChildItem "$certsDir\localhost+*key*.pem" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($certFile -and $keyFile) {
        Copy-Item $certFile.FullName "$certsDir\localhost.pem" -Force
        Copy-Item $keyFile.FullName "$certsDir\localhost-key.pem" -Force
        Write-Host "Certificates generated successfully!" -ForegroundColor Green
        Write-Host "  - certs/localhost.pem" -ForegroundColor White
        Write-Host "  - certs/localhost-key.pem" -ForegroundColor White
        exit 0
    }
}

# Fallback: Generate self-signed certificate using PowerShell
Write-Host "Generating self-signed certificate using PowerShell..." -ForegroundColor Yellow

$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "127.0.0.1", "192.168.8.199", "0.0.0.0" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(1) `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -KeyExportPolicy Exportable

$thumbprint = $cert.Thumbprint
Write-Host "Certificate created (Thumbprint: $thumbprint)" -ForegroundColor Green

# Export to PFX
$pfxPath = Join-Path $certsDir "localhost.pfx"
$certPassword = ConvertTo-SecureString -String "intership" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $certPassword | Out-Null

Write-Host "Certificate exported to PFX: $pfxPath" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Docker/Next.js needs PEM format." -ForegroundColor Yellow
Write-Host "You need OpenSSL to convert PFX to PEM:" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you have OpenSSL installed:" -ForegroundColor Cyan
Write-Host "  cd certs" -ForegroundColor White
Write-Host "  openssl pkcs12 -in localhost.pfx -nocerts -nodes -out localhost-key.pem" -ForegroundColor White
Write-Host "  openssl pkcs12 -in localhost.pfx -clcerts -nokeys -out localhost.pem" -ForegroundColor White
Write-Host "  cd .." -ForegroundColor White
Write-Host ""
Write-Host "Or download mkcert manually and run:" -ForegroundColor Cyan
Write-Host "  .\download-mkcert.ps1" -ForegroundColor White
Write-Host "  .\generate-certs-simple.ps1" -ForegroundColor White

