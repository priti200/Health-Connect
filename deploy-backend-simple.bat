@echo off
echo 🚀 Backend Deployment Starting...
echo =================================

set GCLOUD="C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

echo 📋 Verifying project configuration...
%GCLOUD% config list

echo.
echo 🚀 Starting Cloud Build for Backend...
echo This will build and deploy the Spring Boot backend with H2 database
echo Expected time: 10-15 minutes

%GCLOUD% builds submit --config=deploy-backend.yaml .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Backend deployment successful!
    echo Getting backend URL...
    
    for /f "tokens=*" %%i in ('%GCLOUD% run services describe healthconnect-backend --region=us-central1 --format="value(status.url)"') do set BACKEND_URL=%%i
    
    echo.
    echo 🌐 Backend URL: !BACKEND_URL!
    echo.
    echo 🧪 Testing backend...
    curl !BACKEND_URL!/actuator/health
    
    echo.
    echo ✅ Backend is ready for frontend deployment!
) else (
    echo ❌ Backend deployment failed
    echo Please check the error messages above
)

pause
