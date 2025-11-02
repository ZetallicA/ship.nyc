# Simple certificate generation for HTTPS
$ErrorActionPreference = "Stop"

Write-Host "Generating SSL certificates for HTTPS..." -ForegroundColor Cyan

# Create certs directory
$certsDir = ".\certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
}

# Generate self-signed certificate using PowerShell
Write-Host "Creating self-signed certificate..." -ForegroundColor Yellow

$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "127.0.0.1", "192.168.8.199", "0.0.0.0" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(1)

$thumbprint = $cert.Thumbprint

Write-Host "Certificate created with thumbprint: $thumbprint" -ForegroundColor Green
Write-Host ""
Write-Host "Exporting certificate files..." -ForegroundColor Yellow

# Export certificate
$certPassword = ConvertTo-SecureString -String "password" -Force -AsPlainText
$pfxPath = Join-Path $certsDir "temp.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $certPassword | Out-Null

Write-Host "Certificate exported to $pfxPath" -ForegroundColor Green
Write-Host ""
Write-Host "To extract PEM files, install OpenSSL and run:" -ForegroundColor Yellow
Write-Host "  openssl pkcs12 -in certs/temp.pfx -nocerts -nodes -out certs/localhost-key.pem" -ForegroundColor White
Write-Host "  openssl pkcs12 -in certs/temp.pfx -clcerts -nokeys -out certs/localhost.pem" -ForegroundColor White
Write-Host ""
Write-Host "OR install mkcert (recommended):" -ForegroundColor Cyan
Write-Host "  choco install mkcert" -ForegroundColor White
Write-Host "  mkcert -install" -ForegroundColor White
Write-Host "  cd certs" -ForegroundColor White
Write-Host "  mkcert localhost 127.0.0.1 ::1 192.168.8.199 0.0.0.0" -ForegroundColor White

