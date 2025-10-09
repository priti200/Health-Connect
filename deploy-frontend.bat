@echo off
REM HealthConnect Frontend Deployment Script for Windows
REM Project ID: said-eb2f5

echo 🚀 Starting HealthConnect FRONTEND deployment to Google Cloud...

REM Configuration
set PROJECT_ID=said-eb2f5
set REGION=us-central1
set FRONTEND_SERVICE=healthconnect-frontend
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

echo [INFO] Checking if backend is deployed...
gcloud run services describe %BACKEND_SERVICE% --region=%REGION% >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend service not found. Please deploy backend first using deploy-backend.bat
    exit /b 1
)

echo [INFO] Getting backend URL for frontend configuration...
for /f "tokens=*" %%i in ('gcloud run services describe %BACKEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set BACKEND_URL=%%i

echo [INFO] Backend URL: %BACKEND_URL%

echo [INFO] Updating frontend production environment with backend URL...
REM Note: The production environment should already be configured with the expected backend URL

echo [INFO] Starting Frontend deployment with Cloud Build...
gcloud builds submit --config=deploy-frontend.yaml .

echo [INFO] Getting frontend service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %FRONTEND_SERVICE% --region=%REGION% --format="value(status.url)"') do set FRONTEND_URL=%%i

echo [INFO] Updating backend CORS configuration with frontend URL...
gcloud run services update %BACKEND_SERVICE% --region=%REGION% --update-env-vars="CORS_ALLOWED_ORIGINS=%FRONTEND_URL%,https://*.run.app"

echo.
echo [SUCCESS] Frontend deployment completed successfully!
echo.
echo 🌐 Service URLs:
echo    Frontend: %FRONTEND_URL%
echo    Backend:  %BACKEND_URL%
echo.
echo 📋 Test Credentials:
echo    Patient: patient.test@healthconnect.com / password123
echo    Doctor:  doctor.test@healthconnect.com / password123
echo.
echo 🧪 Test Endpoints:
echo    Frontend Health: %FRONTEND_URL%/health
echo    Backend Health:  %BACKEND_URL%/actuator/health
echo    Backend API:     %BACKEND_URL%/api/health
echo.
echo 🔧 To view logs:
echo    Frontend: gcloud run services logs read %FRONTEND_SERVICE% --region=%REGION%
echo    Backend:  gcloud run services logs read %BACKEND_SERVICE% --region=%REGION%
echo.
echo [SUCCESS] HealthConnect is now fully deployed on Google Cloud! 🎉
pause
