# Convert PFX to PEM using PowerShell/.NET (no OpenSSL required)
param(
    [string]$PfxPath = ".\certs\localhost.pfx",
    [string]$Password = "intership"
)

$ErrorActionPreference = "Stop"

Write-Host "Converting PFX to PEM format..." -ForegroundColor Cyan

# Load certificate from PFX
Add-Type -AssemblyName System.Security
$securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$cert.Import($PfxPath, $securePassword, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# Export certificate (public key) to PEM
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$base64Cert = [Convert]::ToBase64String($certBytes)
$certPEM = "-----BEGIN CERTIFICATE-----`n"
$certPEM += (($base64Cert -replace '.{64}', '$&' + "`n") -split "`n" | Where-Object { $_ }) -join "`n"
$certPEM += "`n-----END CERTIFICATE-----"

$certPath = ".\certs\localhost.pem"
[System.IO.File]::WriteAllText((Resolve-Path ".\certs" -ErrorAction Stop).Path + "\localhost.pem", $certPEM)
Write-Host "Certificate exported to: $certPath" -ForegroundColor Green

# Export private key to PEM
try {
    $rsa = $cert.PrivateKey
    if ($null -eq $rsa) {
        # Try to get private key from cert store
        $rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
    }
    
    if ($null -ne $rsa) {
        $keyParams = $rsa.ExportParameters($true)
        
        # Build RSA private key PEM
        $keyBytes = @()
        $keyBytes += [System.BitConverter]::GetBytes([UInt32]0x3082025E)  # SEQUENCE
        # ... (complex DER encoding - easier with BouncyCastle or similar library)
        
        Write-Host "Private key extraction requires additional libraries." -ForegroundColor Yellow
        Write-Host "Please install OpenSSL or use mkcert for full support." -ForegroundColor Yellow
        
        # Alternative: Export as PKCS#8
        $keyBytes = $rsa.ExportRSAPrivateKey()
        $base64Key = [Convert]::ToBase64String($keyBytes)
        $keyPEM = "-----BEGIN PRIVATE KEY-----`n"
        $keyPEM += (($base64Key -replace '.{64}', '$&' + "`n") -split "`n" | Where-Object { $_ }) -join "`n"
        $keyPEM += "`n-----END PRIVATE KEY-----"
        
        $keyPath = ".\certs\localhost-key.pem"
        [System.IO.File]::WriteAllText((Resolve-Path ".\certs" -ErrorAction Stop).Path + "\localhost-key.pem", $keyPEM)
        Write-Host "Private key exported to: $keyPath" -ForegroundColor Green
    }
} catch {
    Write-Host "Error extracting private key: $_" -ForegroundColor Red
    Write-Host "You may need OpenSSL or mkcert to properly extract the private key." -ForegroundColor Yellow
}

