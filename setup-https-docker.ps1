# Generate SSL certificates for HTTPS
$ErrorActionPreference = "Stop"

Write-Host "Setting up HTTPS for InterShip Application..." -ForegroundColor Cyan

# Create certs directory if it doesn't exist
$certsDir = ".\certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
    Write-Host "Created certs directory" -ForegroundColor Green
}

# Check if certificates already exist
$certPath = Join-Path $certsDir "localhost.pem"
$keyPath = Join-Path $certsDir "localhost-key.pem"

if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
    Write-Host "Generating SSL certificates..." -ForegroundColor Yellow
    
    # Check if mkcert is available
    if (Get-Command mkcert -ErrorAction SilentlyContinue) {
        Write-Host "Using mkcert to generate certificates..." -ForegroundColor Green
        Push-Location $certsDir
        mkcert -install
        mkcert localhost 127.0.0.1 ::1 192.168.8.199 0.0.0.0
        Pop-Location
        
        # Rename files if needed
        if (Test-Path "$certsDir\localhost+4.pem") {
            Move-Item "$certsDir\localhost+4.pem" $certPath -Force
        }
        if (Test-Path "$certsDir\localhost+4-key.pem") {
            Move-Item "$certsDir\localhost+4-key.pem" $keyPath -Force
        }
    } else {
        Write-Host "mkcert not found. Generating self-signed certificate using OpenSSL..." -ForegroundColor Yellow
        
        # Generate self-signed certificate
        $opensslCmd = @"
openssl req -x509 -newkey rsa:4096 -nodes -keyout `"$keyPath`" -out `"$certPath`" -days 365 -subj `/CN=localhost`
"@
        
        if (Get-Command openssl -ErrorAction SilentlyContinue) {
            Invoke-Expression $opensslCmd
        } else {
            Write-Host "OpenSSL not found. Using PowerShell to generate certificate..." -ForegroundColor Yellow
            
            # Use PowerShell to generate self-signed certificate
            $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1", "192.168.8.199" -CertStoreLocation "Cert:\CurrentUser\My" -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddYears(1)
            
            # Export certificate and key
            $certPassword = ConvertTo-SecureString -String "password" -Force -AsPlainText
            Export-PfxCertificate -Cert $cert -FilePath "$certsDir\temp.pfx" -Password $certPassword | Out-Null
            
            # Extract PEM files from PFX (requires OpenSSL or manual extraction)
            Write-Host "Certificate generated. Please use OpenSSL to extract .pem files:" -ForegroundColor Yellow
            Write-Host "  openssl pkcs12 -in temp.pfx -nocerts -nodes -out localhost-key.pem" -ForegroundColor Yellow
            Write-Host "  openssl pkcs12 -in temp.pfx -clcerts -nokeys -out localhost.pem" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Alternatively, install mkcert: https://github.com/FiloSottile/mkcert" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "SSL certificates already exist" -ForegroundColor Green
}

Write-Host ""
Write-Host "HTTPS setup complete!" -ForegroundColor Green
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  Frontend: https://localhost:8080" -ForegroundColor White
Write-Host "  Backend:  https://localhost:8443" -ForegroundColor White
Write-Host ""
Write-Host "Note: You may need to accept the self-signed certificate warning in your browser." -ForegroundColor Yellow

