# Detailed CORS Testing Script

Write-Host "🔍 Detailed CORS Analysis" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$frontendUrl = "https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app"

# Test 1: Check which backend image is currently running
Write-Host ""
Write-Host "🔍 Checking Current Backend Image..." -ForegroundColor Yellow

try {
    $serviceInfo = gcloud run services describe healthconnect-backend --region=us-central1 --format="value(spec.template.spec.template.spec.containers[0].image)" 2>$null
    Write-Host "Current Backend Image: $serviceInfo" -ForegroundColor White
    
    if ($serviceInfo -like "*f34e8726-60ec-42e5-8271-09d3cc9397a0*") {
        Write-Host "✅ Running LATEST image with OPTIONS fix" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Running OLD image without OPTIONS fix" -ForegroundColor Yellow
        Write-Host "   Expected: f34e8726-60ec-42e5-8271-09d3cc9397a0" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Could not check backend image" -ForegroundColor Red
}

# Test 2: Detailed OPTIONS Request Analysis
Write-Host ""
Write-Host "🔍 Detailed OPTIONS Request Analysis..." -ForegroundColor Yellow

try {
    $headers = @{
        'Origin' = $frontendUrl
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'content-type,authorization'
    }
    
    Write-Host "Sending OPTIONS request with headers:" -ForegroundColor Gray
    Write-Host "  Origin: $frontendUrl" -ForegroundColor Gray
    Write-Host "  Access-Control-Request-Method: POST" -ForegroundColor Gray
    Write-Host "  Access-Control-Request-Headers: content-type,authorization" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "✅ OPTIONS Request Successful!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor White
    
    # Analyze response headers
    Write-Host ""
    Write-Host "📋 Response Headers Analysis:" -ForegroundColor Blue
    
    $corsHeaders = @(
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods', 
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Credentials',
        'Access-Control-Max-Age'
    )
    
    foreach ($header in $corsHeaders) {
        if ($response.Headers[$header]) {
            Write-Host "✅ $header`: $($response.Headers[$header])" -ForegroundColor Green
        } else {
            Write-Host "❌ $header`: Missing" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ OPTIONS Request Failed" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host ""
        Write-Host "🔍 403 Forbidden Analysis:" -ForegroundColor Yellow
        Write-Host "  - Spring Security is blocking OPTIONS requests" -ForegroundColor White
        Write-Host "  - SecurityConfig missing: .requestMatchers(HttpMethod.OPTIONS, '/**').permitAll()" -ForegroundColor White
        Write-Host "  - Backend needs to be redeployed with latest code" -ForegroundColor White
    }
}

# Test 3: Check Build Status
Write-Host ""
Write-Host "🔍 Checking Latest Build Status..." -ForegroundColor Yellow

try {
    $buildStatus = gcloud builds describe f34e8726-60ec-42e5-8271-09d3cc9397a0 --format="value(status)" 2>$null
    Write-Host "Latest Build Status: $buildStatus" -ForegroundColor White
    
    if ($buildStatus -eq "SUCCESS") {
        Write-Host "✅ Latest build completed successfully" -ForegroundColor Green
        Write-Host "   Backend should be updated with OPTIONS fix" -ForegroundColor Green
    } elseif ($buildStatus -eq "WORKING") {
        Write-Host "⏳ Build still in progress..." -ForegroundColor Yellow
        Write-Host "   Wait for completion before testing again" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Build failed or unknown status" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not check build status" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Blue
Write-Host "- If build is still WORKING: Wait for completion" -ForegroundColor White
Write-Host "- If build is SUCCESS but still 403: Check image deployment" -ForegroundColor White
Write-Host "- If OPTIONS returns 200: CORS is fixed!" -ForegroundColor White
