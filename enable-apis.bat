@echo off
echo 🔧 Enabling Google Cloud APIs
echo ==============================

cd /d "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

echo Enabling Cloud Build API...
gcloud.cmd services enable cloudbuild.googleapis.com

echo Enabling Cloud Run API...
gcloud.cmd services enable run.googleapis.com

echo Enabling Container Registry API...
gcloud.cmd services enable containerregistry.googleapis.com

echo.
echo ✅ All APIs enabled successfully!
pause
