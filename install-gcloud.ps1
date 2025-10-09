# Google Cloud CLI Installation Script for Windows
# This script downloads and prepares Google Cloud CLI for installation

Write-Host "🚀 HealthConnect - Google Cloud CLI Setup Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script should be run as Administrator for best results" -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
}

# Create temp directory
$tempDir = "$env:TEMP\gcloud-install"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

Write-Host "📥 Downloading Google Cloud CLI installer..." -ForegroundColor Blue

try {
    # Download the installer
    $installerUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
    $installerPath = "$tempDir\GoogleCloudSDKInstaller.exe"
    
    # Use .NET WebClient for download
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($installerUrl, $installerPath)
    
    Write-Host "✅ Download completed successfully!" -ForegroundColor Green
    
    # Check if file exists and has reasonable size
    if ((Test-Path $installerPath) -and ((Get-Item $installerPath).Length -gt 1MB)) {
        Write-Host "📦 Installer ready: $installerPath" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🔧 Starting installation..." -ForegroundColor Blue
        Write-Host "   The installer will open in a new window" -ForegroundColor Yellow
        Write-Host "   Please follow the installation wizard" -ForegroundColor Yellow
        
        # Start the installer
        Start-Process -FilePath $installerPath -Wait
        
        Write-Host ""
        Write-Host "✅ Installation process completed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔄 Next Steps:" -ForegroundColor Blue
        Write-Host "   1. Close this PowerShell window" -ForegroundColor White
        Write-Host "   2. Open a NEW PowerShell window" -ForegroundColor White
        Write-Host "   3. Run: gcloud --version" -ForegroundColor White
        Write-Host "   4. Run: gcloud auth login" -ForegroundColor White
        Write-Host "   5. Run: gcloud config set project said-eb2f5" -ForegroundColor White
        Write-Host "   6. Run: deploy-backend.bat" -ForegroundColor White
        Write-Host ""
        
        # Test if gcloud is available
        Write-Host "🧪 Testing gcloud installation..." -ForegroundColor Blue
        try {
            $gcloudVersion = & gcloud --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ gcloud is now available!" -ForegroundColor Green
                Write-Host $gcloudVersion
                
                Write-Host ""
                Write-Host "🚀 Ready to deploy! Run these commands:" -ForegroundColor Green
                Write-Host "   gcloud auth login" -ForegroundColor Cyan
                Write-Host "   gcloud config set project said-eb2f5" -ForegroundColor Cyan
                Write-Host "   deploy-backend.bat" -ForegroundColor Cyan
            } else {
                Write-Host "⚠️  gcloud not yet in PATH. Please restart your terminal." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️  gcloud not yet in PATH. Please restart your terminal." -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Download failed or file is corrupted" -ForegroundColor Red
        Write-Host "   Please download manually from: https://cloud.google.com/sdk/docs/install-windows" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error downloading installer: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔗 Manual Installation:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://cloud.google.com/sdk/docs/install-windows" -ForegroundColor White
    Write-Host "   2. Download GoogleCloudSDKInstaller.exe" -ForegroundColor White
    Write-Host "   3. Run the installer" -ForegroundColor White
    Write-Host "   4. Restart your terminal" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Blue
Write-Host "   Installation Guide: https://cloud.google.com/sdk/docs/install-windows" -ForegroundColor White
Write-Host "   HealthConnect Deployment: STEP_BY_STEP_DEPLOYMENT.md" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
