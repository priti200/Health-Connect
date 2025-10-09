@echo off
echo Backend Deployment Starting...
echo ===============================

set GCLOUD="C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

echo Current configuration:
%GCLOUD% config list

echo.
echo Starting backend deployment...
echo This will take 10-15 minutes...

%GCLOUD% builds submit --config=deploy-backend.yaml .

echo.
echo Deployment command completed!
pause
