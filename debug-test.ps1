# Debug API Test

Write-Host "🔍 Debug API Test" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"

# Test 1: Check if backend is running the latest image
Write-Host ""
Write-Host "Test 1: Backend Image Check" -ForegroundColor Yellow
try {
    $imageInfo = gcloud run services describe healthconnect-backend --region=us-central1 --format="value(spec.template.spec.template.spec.containers[0].image)" 2>$null
    Write-Host "Current Image: $imageInfo" -ForegroundColor White
    
    if ($imageInfo -like "*0a2e64df-267d-4ba7-96de-ca4fdc1398d0*") {
        Write-Host "✅ Running LATEST image with CORS disabled" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Running different image" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check image" -ForegroundColor Red
}

# Test 2: Test different endpoints to see which ones work
Write-Host ""
Write-Host "Test 2: Endpoint Testing" -ForegroundColor Yellow

$endpoints = @(
    "/",
    "/api",
    "/api/auth",
    "/api/auth/login",
    "/api/test",
    "/actuator/health"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl$endpoint" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ GET $endpoint : $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Write-Host "⚠️ GET $endpoint : 404 (Not Found - Normal)" -ForegroundColor Yellow
        } elseif ($statusCode -eq 403) {
            Write-Host "❌ GET $endpoint : 403 (Forbidden - Security Issue)" -ForegroundColor Red
        } else {
            Write-Host "❌ GET $endpoint : $statusCode" -ForegroundColor Red
        }
    }
}

# Test 3: Test OPTIONS specifically
Write-Host ""
Write-Host "Test 3: OPTIONS Request Test" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method OPTIONS -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ OPTIONS /api/auth/login : $($response.StatusCode)" -ForegroundColor Green
    
    # Check for CORS headers
    Write-Host "Response Headers:" -ForegroundColor Gray
    $response.Headers.GetEnumerator() | ForEach-Object { 
        if ($_.Key -like "*Access-Control*" -or $_.Key -like "*Allow*") {
            Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ OPTIONS /api/auth/login : $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 4: Test POST with proper headers
Write-Host ""
Write-Host "Test 4: POST Authentication Test" -ForegroundColor Yellow
try {
    $headers = @{
        'Content-Type' = 'application/json'
        'Accept' = 'application/json'
    }
    
    $body = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $body -Headers $headers -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ POST /api/auth/login : $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ POST /api/auth/login : $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Analysis:" -ForegroundColor Blue
Write-Host "- If all endpoints return 403: Spring Security blocking everything" -ForegroundColor White
Write-Host "- If some work and some don't: Specific endpoint security issue" -ForegroundColor White
Write-Host "- If OPTIONS works but POST doesn't: Authentication issue" -ForegroundColor White
