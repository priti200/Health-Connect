# HealthConnect Backend Deployment PowerShell Script

Write-Host "🚀 HealthConnect Backend Deployment" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

$gcloudPath = "C:\Users\DELL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

Write-Host "📋 Verifying project configuration..." -ForegroundColor Blue
& $gcloudPath config list

Write-Host ""
Write-Host "🚀 Starting Cloud Build for Backend..." -ForegroundColor Blue
Write-Host "This will build and deploy the Spring Boot backend with H2 database" -ForegroundColor Yellow
Write-Host "Expected time: 10-15 minutes" -ForegroundColor Yellow
Write-Host ""

& $gcloudPath builds submit --config=deploy-backend.yaml .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend deployment successful!" -ForegroundColor Green
    Write-Host "Getting backend URL..." -ForegroundColor Blue

    $backendUrl = & $gcloudPath run services describe healthconnect-backend --region=us-central1 --format="value(status.url)"

    Write-Host ""
    Write-Host "🌐 Backend URL: $backendUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Testing backend..." -ForegroundColor Blue

    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/actuator/health" -Method GET -TimeoutSec 30
        Write-Host "✅ Backend health check successful!" -ForegroundColor Green
        Write-Host $response.Content
    } catch {
        Write-Host "⚠️ Backend health check failed, but deployment completed" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "✅ Backend is ready for frontend deployment!" -ForegroundColor Green
    Write-Host "📋 Test Credentials:" -ForegroundColor Blue
    Write-Host "   Patient: patient.test@healthconnect.com / password123" -ForegroundColor White
    Write-Host "   Doctor:  doctor.test@healthconnect.com / password123" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Next step: Deploy Frontend" -ForegroundColor Blue
    Write-Host "   Run: .\deploy-frontend.ps1" -ForegroundColor Cyan

} else {
    Write-Host "❌ Backend deployment failed" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
