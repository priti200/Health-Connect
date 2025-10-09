@echo off
echo 🚀 HealthConnect - Quick Google Cloud CLI Installation
echo =====================================================

echo 📥 Downloading Google Cloud CLI installer...

REM Download the installer using PowerShell
powershell -Command "& {Invoke-WebRequest -Uri 'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe' -OutFile 'GoogleCloudSDKInstaller.exe'}"

if exist GoogleCloudSDKInstaller.exe (
    echo ✅ Download completed successfully!
    echo 🔧 Starting installation...
    echo    Please follow the installation wizard that opens
    
    REM Run the installer
    start /wait GoogleCloudSDKInstaller.exe
    
    echo ✅ Installation completed!
    echo.
    echo 🔄 Next Steps:
    echo    1. Close this window
    echo    2. Open a NEW command prompt
    echo    3. Run: gcloud --version
    echo    4. Run: gcloud auth login
    echo    5. Run: gcloud config set project said-eb2f5
    echo    6. Run: deploy-backend.bat
    echo.
    
    REM Test if gcloud is available
    echo 🧪 Testing gcloud installation...
    gcloud --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ gcloud is ready!
        echo 🚀 You can now run: deploy-backend.bat
    ) else (
        echo ⚠️  Please restart your command prompt to use gcloud
    )
    
) else (
    echo ❌ Download failed
    echo 🔗 Please download manually from:
    echo    https://cloud.google.com/sdk/docs/install-windows
)

echo.
pause
