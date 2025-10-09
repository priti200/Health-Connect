@echo off
REM HealthConnect Backend Deployment Script for Windows
REM Project ID: said-eb2f5

echo 🚀 Starting HealthConnect BACKEND deployment to Google Cloud...

REM Configuration
set PROJECT_ID=said-eb2f5
set REGION=us-central1
set BACKEND_SERVICE=healthconnect-backend

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

echo [INFO] Starting Backend deployment with Cloud Build...
gcloud builds submit --config=deploy-backend.yaml .

echo [INFO] Getting backend service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %BACKEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set BACKEND_URL=%%i

echo.
echo [SUCCESS] Backend deployment completed successfully!
echo.
echo 🌐 Backend Service URL:
echo    %BACKEND_URL%
echo.
echo 🧪 Test Backend Health:
echo    %BACKEND_URL%/actuator/health
echo.
echo 📋 Test API Endpoint:
echo    %BACKEND_URL%/api/health
echo.
echo 🔧 To view backend logs:
echo    gcloud run services logs read %BACKEND_SERVICE% --region=%REGION%
echo.
echo 📊 To view backend service details:
echo    gcloud run services describe %BACKEND_SERVICE% --region=%REGION%
echo.
echo [SUCCESS] Backend is now live on Google Cloud! 🎉
echo [INFO] You can now deploy the frontend using deploy-frontend.bat
pause
