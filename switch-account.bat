@echo off
echo 🔄 Switching to correct Google Cloud account
echo ============================================

set GCLOUD="C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

echo 📤 Signing out current account...
%GCLOUD% auth revoke krishnasuhascharugundla@gmail.com

echo.
echo 🔐 Please sign in with: anudeepbatchu10@gmail.com
echo A browser window will open for authentication...
%GCLOUD% auth login

echo.
echo 🎯 Setting project to said-eb2f5...
%GCLOUD% config set project said-eb2f5

echo.
echo ✅ Account switched successfully!
echo 📋 Current configuration:
%GCLOUD% config list

echo.
echo 🚀 Ready to deploy! Run: deploy-backend.bat
pause
