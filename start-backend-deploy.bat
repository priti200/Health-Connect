@echo off
echo 🚀 Starting Backend Deployment
echo ===============================

cd /d "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

echo 📋 Current project configuration:
gcloud.cmd config list

echo.
echo 🚀 Starting Cloud Build for Backend...
echo This will take 10-15 minutes...
echo Building Spring Boot backend with H2 database...

cd /d "%~dp0"
gcloud.cmd builds submit --config=deploy-backend.yaml .

echo.
echo ✅ Backend deployment completed!
pause
