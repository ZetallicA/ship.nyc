# PowerShell script to generate SSL certificates for development
# Run this as Administrator

Write-Host "========================================" -ForegroundColor Green
Write-Host "InterShip SSL Certificate Generator" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = "localhost"
}

Write-Host "Local IP Address: $localIP" -ForegroundColor Cyan
Write-Host ""

# Create certificates directory
$certDir = "Y:\proj2\certs"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force
    Write-Host "Created certificates directory: $certDir" -ForegroundColor Green
}

# Generate private key
$privateKeyPath = "$certDir\localhost.key"
$certPath = "$certDir\localhost.crt"

Write-Host "Generating SSL certificate..." -ForegroundColor Yellow

# Create a self-signed certificate
$cert = New-SelfSignedCertificate -DnsName @("localhost", $localIP, "127.0.0.1") -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)

# Export certificate to file
$certPassword = ConvertTo-SecureString -String "intership123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "$certDir\localhost.pfx" -Password $certPassword

# Export certificate to CRT format
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($certPath, $certBytes)

Write-Host ""
Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
Write-Host "Certificate files:" -ForegroundColor Cyan
Write-Host "  - $certPath" -ForegroundColor White
Write-Host "  - $certDir\localhost.pfx" -ForegroundColor White
Write-Host ""
Write-Host "Certificate password: intership123" -ForegroundColor Yellow
Write-Host ""
Write-Host "To trust the certificate, run this command:" -ForegroundColor Yellow
Write-Host "certlm.msc" -ForegroundColor White
Write-Host "Then import $certDir\localhost.pfx into 'Trusted Root Certification Authorities'" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"


