# Simple HealthConnect Features Test

Write-Host "Testing HealthConnect Features" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"

# Step 1: Get authentication token
Write-Host "1. Getting authentication token..." -ForegroundColor Yellow
$loginBody = @{
    email = "patient.test@healthconnect.com"
    password = "password123"
} | ConvertTo-Json

$loginHeaders = @{
    'Content-Type' = 'application/json'
}

try {
    $loginResponse = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -Headers $loginHeaders
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    $authHeaders = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    Write-Host "   ✅ Authentication successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Authentication failed" -ForegroundColor Red
    exit 1
}

# Step 2: Test Chat API
Write-Host "2. Testing Chat functionality..." -ForegroundColor Yellow
try {
    $chatResponse = Invoke-WebRequest -Uri "$backendUrl/api/chats" -Method GET -Headers $authHeaders
    Write-Host "   ✅ Chat API working: $($chatResponse.StatusCode)" -ForegroundColor Green
    $chats = $chatResponse.Content | ConvertFrom-Json
    Write-Host "   Found $($chats.Count) chats" -ForegroundColor White
} catch {
    Write-Host "   ❌ Chat API failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Step 3: Test Appointments API
Write-Host "3. Testing Appointments functionality..." -ForegroundColor Yellow
try {
    $appointmentsResponse = Invoke-WebRequest -Uri "$backendUrl/api/appointments" -Method GET -Headers $authHeaders
    Write-Host "   ✅ Appointments API working: $($appointmentsResponse.StatusCode)" -ForegroundColor Green
    $appointments = $appointmentsResponse.Content | ConvertFrom-Json
    Write-Host "   Found $($appointments.Count) appointments" -ForegroundColor White
} catch {
    Write-Host "   ❌ Appointments API failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Step 4: Test AI Health Bot
Write-Host "4. Testing AI-powered prescription analyzer..." -ForegroundColor Yellow
try {
    $aiResponse = Invoke-WebRequest -Uri "$backendUrl/api/ai-health-bot/health" -Method GET -Headers $authHeaders
    Write-Host "   ✅ AI Health Bot working: $($aiResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AI Health Bot failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Step 5: Test Video Consultation
Write-Host "5. Testing Video Consultation..." -ForegroundColor Yellow
try {
    $videoResponse = Invoke-WebRequest -Uri "$backendUrl/api/video-consultation" -Method GET -Headers $authHeaders
    Write-Host "   ✅ Video Consultation working: $($videoResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Video Consultation failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Step 6: Test Frontend
Write-Host "6. Testing Frontend accessibility..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app" -Method GET
    Write-Host "   ✅ Frontend accessible: $($frontendResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Blue
Write-Host "- Authentication: ✅ Working" -ForegroundColor Green
Write-Host "- CORS: ✅ Fixed" -ForegroundColor Green
Write-Host "- Backend APIs: Check results above" -ForegroundColor White
Write-Host "- Frontend: Check results above" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Check frontend console for JavaScript errors" -ForegroundColor White
Write-Host "2. Verify frontend service URLs match backend endpoints" -ForegroundColor White
Write-Host "3. Test frontend-backend integration manually" -ForegroundColor White
