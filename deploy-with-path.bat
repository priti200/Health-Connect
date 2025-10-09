@echo off
echo 🚀 HealthConnect Deployment with Full Path
echo ==========================================

REM Common Google Cloud SDK installation paths
set GCLOUD_PATH1="C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
set GCLOUD_PATH2="C:\Users\%USERNAME%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
set GCLOUD_PATH3="C:\google-cloud-sdk\bin\gcloud.cmd"

REM Try to find gcloud
if exist %GCLOUD_PATH1% (
    set GCLOUD=%GCLOUD_PATH1%
    echo ✅ Found gcloud at: %GCLOUD_PATH1%
) else if exist %GCLOUD_PATH2% (
    set GCLOUD=%GCLOUD_PATH2%
    echo ✅ Found gcloud at: %GCLOUD_PATH2%
) else if exist %GCLOUD_PATH3% (
    set GCLOUD=%GCLOUD_PATH3%
    echo ✅ Found gcloud at: %GCLOUD_PATH3%
) else (
    echo ❌ Could not find gcloud installation
    echo Please run: gcloud auth login
    echo Then run: deploy-backend.bat
    pause
    exit /b 1
)

echo 📋 Project: said-eb2f5
echo 🌍 Region: us-central1

echo.
echo 🔐 Step 1: Authentication
echo Please complete authentication in the browser window that opens...
%GCLOUD% auth login

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Authentication failed
    pause
    exit /b 1
)

echo.
echo 🎯 Step 2: Setting project
%GCLOUD% config set project said-eb2f5

echo.
echo 🔧 Step 3: Enabling APIs
echo Enabling Cloud Build API...
%GCLOUD% services enable cloudbuild.googleapis.com

echo Enabling Cloud Run API...
%GCLOUD% services enable run.googleapis.com

echo Enabling Container Registry API...
%GCLOUD% services enable containerregistry.googleapis.com

echo.
echo 🚀 Step 4: Deploying Backend
echo This will take 10-15 minutes...
%GCLOUD% builds submit --config=deploy-backend.yaml .

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend deployment failed
    echo Check the logs above for errors
    pause
    exit /b 1
)

echo.
echo 🌐 Step 5: Getting Backend URL
for /f "tokens=*" %%i in ('%GCLOUD% run services describe healthconnect-backend --region=us-central1 --format="value(status.url)"') do set BACKEND_URL=%%i

echo.
echo ✅ Backend deployment completed successfully!
echo.
echo 🌐 Backend URL: %BACKEND_URL%
echo.
echo 🧪 Testing backend...
curl %BACKEND_URL%/actuator/health

echo.
echo 📋 Test Credentials:
echo    Patient: patient.test@healthconnect.com / password123
echo    Doctor:  doctor.test@healthconnect.com / password123
echo.
echo 🎯 Next Step: Deploy Frontend
echo    Run: deploy-frontend.bat
echo.
pause
