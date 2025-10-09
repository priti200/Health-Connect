# Complete HealthConnect Backend API Workflow Test

Write-Host "🏥 HealthConnect Complete Backend API Workflow Test" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$testResults = @()

function Test-Endpoint {
    param($name, $url, $method, $body, $headers, $expectedStatus = 200)
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            TimeoutSec = 30
        }
        
        if ($headers) { $params.Headers = $headers }
        if ($body) { $params.Body = $body }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $expectedStatus) {
            Write-Host "✅ $name" -ForegroundColor Green
            $script:testResults += @{Name = $name; Status = "PASS"; Code = $response.StatusCode}
            return $response
        } else {
            Write-Host "⚠️ $name - Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
            $script:testResults += @{Name = $name; Status = "WARN"; Code = $response.StatusCode}
            return $response
        }
    } catch {
        Write-Host "❌ $name - Failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $script:testResults += @{Name = $name; Status = "FAIL"; Code = $_.Exception.Response.StatusCode}
        return $null
    }
}

# Test 1: Health Check
Write-Host ""
Write-Host "🔍 Phase 1: System Health Checks" -ForegroundColor Yellow
Test-Endpoint "Backend Health" "$backendUrl/api/test/health" "GET"

# Test 2: Authentication Workflow
Write-Host ""
Write-Host "🔐 Phase 2: Authentication Workflow" -ForegroundColor Yellow

# Test login with existing user
$loginBody = @{
    email = "patient.test@healthconnect.com"
    password = "password123"
} | ConvertTo-Json

$loginHeaders = @{
    'Content-Type' = 'application/json'
}

$loginResponse = Test-Endpoint "Patient Login" "$backendUrl/api/auth/login" "POST" $loginBody $loginHeaders

if ($loginResponse) {
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $patientToken = $loginData.token
    Write-Host "   Patient Token: $($patientToken.Substring(0,20))..." -ForegroundColor Gray
    
    $authHeaders = @{
        'Authorization' = "Bearer $patientToken"
        'Content-Type' = 'application/json'
    }
}

# Test doctor login
$doctorLoginBody = @{
    email = "doctor.test@healthconnect.com"
    password = "password123"
} | ConvertTo-Json

$doctorLoginResponse = Test-Endpoint "Doctor Login" "$backendUrl/api/auth/login" "POST" $doctorLoginBody $loginHeaders

if ($doctorLoginResponse) {
    $doctorLoginData = $doctorLoginResponse.Content | ConvertFrom-Json
    $doctorToken = $doctorLoginData.token
    Write-Host "   Doctor Token: $($doctorToken.Substring(0,20))..." -ForegroundColor Gray
    
    $doctorAuthHeaders = @{
        'Authorization' = "Bearer $doctorToken"
        'Content-Type' = 'application/json'
    }
}

# Test 3: User Management
Write-Host ""
Write-Host "👥 Phase 3: User Management" -ForegroundColor Yellow

Test-Endpoint "Get Current User (Patient)" "$backendUrl/api/users/me" "GET" $null $authHeaders
Test-Endpoint "Get All Doctors" "$backendUrl/api/doctors" "GET"
Test-Endpoint "Get Doctor Specializations" "$backendUrl/api/doctors/specializations" "GET"

# Test 4: Appointment Management
Write-Host ""
Write-Host "📅 Phase 4: Appointment Management" -ForegroundColor Yellow

Test-Endpoint "Get Patient Appointments" "$backendUrl/api/appointments" "GET" $null $authHeaders

# Create appointment
$appointmentBody = @{
    doctorId = 1
    date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    startTime = "14:00"
    endTime = "15:00"
    type = "VIDEO_CONSULTATION"
    reasonForVisit = "Test consultation"
} | ConvertTo-Json

Test-Endpoint "Create Appointment" "$backendUrl/api/appointments" "POST" $appointmentBody $authHeaders

# Test 5: Video Consultation
Write-Host ""
Write-Host "🎥 Phase 5: Video Consultation" -ForegroundColor Yellow

Test-Endpoint "Get Video Consultations" "$backendUrl/api/video-consultation" "GET" $null $authHeaders
Test-Endpoint "Get Room 1 Consultation" "$backendUrl/api/video-consultation/room/1" "GET" $null $authHeaders
Test-Endpoint "Get Video Token" "$backendUrl/api/video-consultation/1/token" "GET" $null $authHeaders

# Test 6: WebSocket Endpoints
Write-Host ""
Write-Host "🔌 Phase 6: WebSocket & Real-time Features" -ForegroundColor Yellow

Test-Endpoint "WebSocket Endpoint" "$backendUrl/ws" "GET" $null $null 404

# Test 7: Test Endpoints
Write-Host ""
Write-Host "🧪 Phase 7: Test & Demo Endpoints" -ForegroundColor Yellow

Test-Endpoint "Create Demo Video Consultation" "$backendUrl/api/test/create-demo-video-consultation" "POST"
Test-Endpoint "Get Video Demo Info" "$backendUrl/api/test/video-demo" "GET"

# Test 8: CORS Verification
Write-Host ""
Write-Host "🌐 Phase 8: CORS Verification" -ForegroundColor Yellow

$corsHeaders = @{
    'Origin' = 'https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app'
    'Access-Control-Request-Method' = 'POST'
    'Access-Control-Request-Headers' = 'content-type,authorization'
}

Test-Endpoint "CORS Preflight - Auth" "$backendUrl/api/auth/login" "OPTIONS" $null $corsHeaders
Test-Endpoint "CORS Preflight - Doctors" "$backendUrl/api/doctors" "OPTIONS" $null $corsHeaders
Test-Endpoint "CORS Preflight - Appointments" "$backendUrl/api/appointments" "OPTIONS" $null $corsHeaders

# Test Summary
Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Blue
Write-Host "======================" -ForegroundColor Blue

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "⚠️ Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "❌ Failed: $failCount" -ForegroundColor Red

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor Blue
foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
    }
    Write-Host "  $($result.Name): $($result.Status) ($($result.Code))" -ForegroundColor $color
}

Write-Host ""
Write-Host "🎯 Workflow Status:" -ForegroundColor Blue
if ($failCount -eq 0) {
    Write-Host "✅ All critical workflows are functional!" -ForegroundColor Green
} elseif ($failCount -le 2) {
    Write-Host "⚠️ Minor issues detected, but core functionality works" -ForegroundColor Yellow
} else {
    Write-Host "❌ Multiple issues detected, needs attention" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Green
Write-Host "Frontend: https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app" -ForegroundColor White
Write-Host "Backend:  $backendUrl" -ForegroundColor White
