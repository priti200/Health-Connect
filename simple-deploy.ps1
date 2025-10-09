Write-Host "🚀 HealthConnect Backend Deployment" -ForegroundColor Green

$gcloudPath = "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

Write-Host "📋 Current configuration:" -ForegroundColor Blue
& $gcloudPath config list

Write-Host ""
Write-Host "🚀 Starting backend deployment..." -ForegroundColor Blue
Write-Host "This will take 10-15 minutes..." -ForegroundColor Yellow

& $gcloudPath builds submit --config=deploy-backend.yaml .

Write-Host ""
Write-Host "✅ Deployment command completed!" -ForegroundColor Green
