@echo off
echo 🚀 HealthConnect Backend Deployment
echo ===================================

cd /d "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

echo 🎯 Setting project to said-eb2f5...
gcloud.cmd config set project said-eb2f5

echo.
echo 🔧 Enabling required APIs...
echo Enabling Cloud Build API...
gcloud.cmd services enable cloudbuild.googleapis.com

echo Enabling Cloud Run API...
gcloud.cmd services enable run.googleapis.com

echo Enabling Container Registry API...
gcloud.cmd services enable containerregistry.googleapis.com

echo.
echo ✅ APIs enabled successfully!

echo.
echo 🚀 Starting Backend Deployment...
echo This will take 10-15 minutes...
echo Building and deploying Spring Boot backend with H2 database...

cd /d "%~dp0"
gcloud.cmd builds submit --config=deploy-backend.yaml .

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend deployment failed
    echo Check the logs above for errors
    pause
    exit /b 1
)

echo.
echo 🌐 Getting Backend URL...
cd /d "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"
for /f "tokens=*" %%i in ('gcloud.cmd run services describe healthconnect-backend --region=us-central1 --format="value(status.url)"') do set BACKEND_URL=%%i

echo.
echo ✅ Backend deployment completed successfully!
echo.
echo 🌐 Backend URL: %BACKEND_URL%
echo.
echo 🧪 Testing backend health...
curl %BACKEND_URL%/actuator/health

echo.
echo 📋 Test Credentials:
echo    Patient: patient.test@healthconnect.com / password123
echo    Doctor:  doctor.test@healthconnect.com / password123
echo.
echo 🎯 Backend is ready! Next step: Deploy Frontend
echo    Run: deploy-frontend.bat
echo.
pause
