@echo off
REM HealthConnect Google Cloud Deployment Script for Windows
REM Project ID: said-eb2f5

echo 🚀 Starting HealthConnect deployment to Google Cloud...

REM Configuration
set PROJECT_ID=said-eb2f5
set REGION=us-central1
set BACKEND_SERVICE=healthconnect-backend
set FRONTEND_SERVICE=healthconnect-frontend

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] gcloud CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr /r "." >nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] You are not authenticated with gcloud. Please run 'gcloud auth login'
    exit /b 1
)

echo [INFO] Setting project to %PROJECT_ID%...
gcloud config set project %PROJECT_ID%

echo [INFO] Enabling required Google Cloud APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo [INFO] Starting Cloud Build deployment...
gcloud builds submit --config=cloudbuild.yaml .

echo [INFO] Getting service URLs...
for /f "tokens=*" %%i in ('gcloud run services describe %BACKEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set BACKEND_URL=%%i
for /f "tokens=*" %%i in ('gcloud run services describe %FRONTEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set FRONTEND_URL=%%i

echo.
echo [SUCCESS] Deployment completed successfully!
echo.
echo 🌐 Service URLs:
echo    Frontend: %FRONTEND_URL%
echo    Backend:  %BACKEND_URL%
echo.
echo 📋 Test Credentials:
echo    Patient: patient.test@healthconnect.com / password123
echo    Doctor:  doctor.test@healthconnect.com / password123
echo.
echo 🔧 To view logs:
echo    Backend:  gcloud run services logs read %BACKEND_SERVICE% --region=%REGION%
echo    Frontend: gcloud run services logs read %FRONTEND_SERVICE% --region=%REGION%
echo.
echo 📊 To view services:
echo    gcloud run services list --region=%REGION%
echo.
echo [SUCCESS] HealthConnect is now live on Google Cloud! 🎉
pause
