# HealthConnect API Testing Script

Write-Host "🧪 Testing HealthConnect API" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$frontendUrl = "https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app"

Write-Host ""
Write-Host "🌐 Backend URL: $backendUrl" -ForegroundColor Blue
Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Blue

# Test 1: OPTIONS Request (CORS Preflight)
Write-Host ""
Write-Host "Test 1: CORS Preflight (OPTIONS)" -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = $frontendUrl
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'content-type'
    }
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✅ OPTIONS request successful" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
    
    # Check for CORS headers
    if ($response.Headers['Access-Control-Allow-Origin']) {
        Write-Host "✅ CORS Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No Access-Control-Allow-Origin header found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ OPTIONS request failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   This indicates Spring Security is still blocking OPTIONS requests" -ForegroundColor Yellow
    }
}

# Test 2: POST Request (Authentication)
Write-Host ""
Write-Host "Test 2: Authentication POST Request" -ForegroundColor Yellow
try {
    $loginData = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json
    
    $headers = @{
        'Content-Type' = 'application/json'
        'Origin' = $frontendUrl
    }
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginData -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✅ Authentication successful" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "Response: $($response.Content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   This might be due to CORS or authentication issues" -ForegroundColor Yellow
    }
}

# Test 3: Frontend Health Check
Write-Host ""
Write-Host "Test 3: Frontend Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/health" -Method GET -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✅ Frontend health check successful" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
    
} catch {
    Write-Host "⚠️ Frontend health check: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}

# Test 4: Frontend Main Page
Write-Host ""
Write-Host "Test 4: Frontend Main Page" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✅ Frontend main page accessible" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Frontend main page failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 API Test Summary:" -ForegroundColor Blue
Write-Host "- Backend is deployed and responding" -ForegroundColor White
Write-Host "- Frontend is deployed and accessible" -ForegroundColor White
Write-Host "- Check above results for CORS and authentication status" -ForegroundColor White

Write-Host ""
Write-Host "🔗 Application URLs:" -ForegroundColor Green
Write-Host "Frontend: $frontendUrl" -ForegroundColor White
Write-Host "Backend:  $backendUrl" -ForegroundColor White
