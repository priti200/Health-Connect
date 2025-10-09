# HealthConnect Frontend Deployment Script

Write-Host "🎨 HealthConnect Frontend Deployment" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$gcloudPath = "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

Write-Host "📋 Checking backend deployment..." -ForegroundColor Blue
try {
    $backendUrl = & $gcloudPath run services describe healthconnect-backend --region=us-central1 --format="value(status.url)" 2>$null
    if ($backendUrl) {
        Write-Host "✅ Backend found at: $backendUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend not found. Please deploy backend first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Backend not deployed yet. Please wait for backend deployment to complete." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Frontend Deployment..." -ForegroundColor Blue
Write-Host "Building Angular application with production configuration..." -ForegroundColor Yellow
Write-Host "Expected time: 5-10 minutes" -ForegroundColor Yellow

Set-Location "C:\Users\DELL\Videos\Meditech-new\Meditech-new"
& $gcloudPath builds submit --config=deploy-frontend.yaml .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Frontend deployment successful!" -ForegroundColor Green
    
    $frontendUrl = & $gcloudPath run services describe healthconnect-frontend --region=us-central1 --format="value(status.url)"
    
    Write-Host ""
    Write-Host "🌐 Service URLs:" -ForegroundColor Green
    Write-Host "   Frontend: $frontendUrl" -ForegroundColor White
    Write-Host "   Backend:  $backendUrl" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔧 Updating backend CORS configuration..." -ForegroundColor Blue
    & $gcloudPath run services update healthconnect-backend --region=us-central1 --update-env-vars="CORS_ALLOWED_ORIGINS=$frontendUrl,https://*.run.app"
    
    Write-Host ""
    Write-Host "🧪 Testing endpoints..." -ForegroundColor Blue
    try {
        $healthResponse = Invoke-WebRequest -Uri "$backendUrl/actuator/health" -Method GET -TimeoutSec 30
        Write-Host "✅ Backend health check: OK" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Backend health check failed" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 HealthConnect is now live on Google Cloud!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Test Credentials:" -ForegroundColor Blue
    Write-Host "   Patient: patient.test@healthconnect.com / password123" -ForegroundColor White
    Write-Host "   Doctor:  doctor.test@healthconnect.com / password123" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Access your application:" -ForegroundColor Blue
    Write-Host "   $frontendUrl" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
