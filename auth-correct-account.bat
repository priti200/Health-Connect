@echo off
echo 🔐 Authenticating with anudeepbatchu10@gmail.com
echo ===============================================

cd /d "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

echo Please sign in with: anudeepbatchu10@gmail.com
echo A browser window will open...
gcloud.cmd auth login

echo.
echo Setting project...
gcloud.cmd config set project said-eb2f5

echo.
echo Verifying access...
gcloud.cmd projects describe said-eb2f5

echo.
echo ✅ Ready to deploy!
pause
