# Comprehensive HealthConnect Backend Testing Script

Write-Host "🔍 HealthConnect Backend Comprehensive Testing" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$testResults = @()

function Test-Endpoint {
    param($name, $url, $method = "GET", $body = $null, $headers = @{}, $expectedStatus = 200)
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            TimeoutSec = 30
        }
        
        if ($body) {
            $params.Body = $body
            $params.ContentType = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $expectedStatus) {
            Write-Host "  ✅ $name`: $($response.StatusCode)" -ForegroundColor Green
            return @{ Name = $name; Status = $response.StatusCode; Success = $true; Response = $response.Content }
        } else {
            Write-Host "  ⚠️ $name`: $($response.StatusCode) (Expected: $expectedStatus)" -ForegroundColor Yellow
            return @{ Name = $name; Status = $response.StatusCode; Success = $false; Response = $response.Content }
        }
        
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "Unknown" }
        
        if ($statusCode -eq $expectedStatus) {
            Write-Host "  ✅ $name`: $statusCode (Expected)" -ForegroundColor Green
            return @{ Name = $name; Status = $statusCode; Success = $true; Response = $null }
        } else {
            Write-Host "  ❌ $name`: $statusCode" -ForegroundColor Red
            return @{ Name = $name; Status = $statusCode; Success = $false; Response = $null }
        }
    }
}

# Phase 1: Test Public Endpoints
Write-Host ""
Write-Host "📋 Phase 1: Testing Public Endpoints" -ForegroundColor Yellow

$publicTests = @(
    @{ name = "Health Check"; url = "$backendUrl/api/health" },
    @{ name = "Test Health"; url = "$backendUrl/api/test/health" },
    @{ name = "Get All Doctors"; url = "$backendUrl/api/doctors" },
    @{ name = "Doctor Specializations"; url = "$backendUrl/api/doctors/specializations" },
    @{ name = "Gemini Health"; url = "$backendUrl/api/gemini/health" },
    @{ name = "Debug All Doctors"; url = "$backendUrl/api/doctors/debug/all" }
)

foreach ($test in $publicTests) {
    $result = Test-Endpoint -name $test.name -url $test.url
    $testResults += $result
}

# Phase 2: Test Authentication
Write-Host ""
Write-Host "🔐 Phase 2: Testing Authentication" -ForegroundColor Yellow

$loginBody = '{"email":"patient.test@healthconnect.com","password":"password123"}'
$loginResult = Test-Endpoint -name "Patient Login" -url "$backendUrl/api/auth/login" -method "POST" -body $loginBody
$testResults += $loginResult

# Get auth token
$authToken = $null
if ($loginResult.Success) {
    try {
        $loginData = $loginResult.Response | ConvertFrom-Json
        $authToken = $loginData.token
        Write-Host "  🔑 Auth token obtained successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to parse auth token" -ForegroundColor Red
    }
}

# Phase 3: Test Authenticated Endpoints
Write-Host ""
Write-Host "🔒 Phase 3: Testing Authenticated Endpoints" -ForegroundColor Yellow

$authHeaders = @{}
if ($authToken) {
    $authHeaders = @{'Authorization' = "Bearer $authToken"}
}

$authTests = @(
    @{ name = "Get Current User"; url = "$backendUrl/api/users/me" },
    @{ name = "Get Appointments"; url = "$backendUrl/api/appointments" },
    @{ name = "Get Chats"; url = "$backendUrl/api/chats" },
    @{ name = "Video Consultations"; url = "$backendUrl/api/video-consultation" },
    @{ name = "AI Health Bot Health"; url = "$backendUrl/api/ai-health-bot/health" },
    @{ name = "Insurance Health"; url = "$backendUrl/api/insurance/health" },
    @{ name = "Digital Prescription Health"; url = "$backendUrl/api/digital-prescription/health" }
)

foreach ($test in $authTests) {
    $result = Test-Endpoint -name $test.name -url $test.url -headers $authHeaders
    $testResults += $result
}

# Phase 4: Test Doctor Time Slots (The Problematic Endpoint)
Write-Host ""
Write-Host "⏰ Phase 4: Testing Doctor Time Slots" -ForegroundColor Yellow

# First, get the list of doctors to see what IDs exist
try {
    $doctorsResponse = Invoke-WebRequest -Uri "$backendUrl/api/doctors/debug/all" -Method GET
    $doctors = $doctorsResponse.Content | ConvertFrom-Json
    
    Write-Host "  📋 Available Doctors:" -ForegroundColor Cyan
    foreach ($doctor in $doctors) {
        Write-Host "    ID: $($doctor.id), Name: $($doctor.name), Specialization: $($doctor.specialization)" -ForegroundColor White
    }
    
    # Test time slots for first few doctors
    $doctorIdsToTest = $doctors | Select-Object -First 3 | ForEach-Object { $_.id }
    
    foreach ($doctorId in $doctorIdsToTest) {
        $result = Test-Endpoint -name "Doctor $doctorId Time Slots" -url "$backendUrl/api/doctors/$doctorId/time-slots?date=2025-06-21"
        $testResults += $result
    }
    
} catch {
    Write-Host "  ❌ Failed to get doctors list" -ForegroundColor Red
}

# Phase 5: Test POST Operations
Write-Host ""
Write-Host "📝 Phase 5: Testing POST Operations" -ForegroundColor Yellow

# Test appointment creation
$appointmentBody = '{"doctorId":1,"date":"2025-06-22","startTime":"14:00","endTime":"15:00","type":"VIDEO_CONSULTATION","reasonForVisit":"Test appointment"}'
$result = Test-Endpoint -name "Create Appointment" -url "$backendUrl/api/appointments" -method "POST" -body $appointmentBody -headers $authHeaders
$testResults += $result

# Test Gemini proxy with proper validation
$geminiBody = '{"image_base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="}'
$result = Test-Endpoint -name "Gemini Analyze (Valid Base64)" -url "$backendUrl/api/gemini/analyze" -method "POST" -body $geminiBody
$testResults += $result

# Test Gemini proxy with invalid data
$geminiInvalidBody = '{"image_base64":"invalid_data"}'
$result = Test-Endpoint -name "Gemini Analyze (Invalid Data)" -url "$backendUrl/api/gemini/analyze" -method "POST" -body $geminiInvalidBody -expectedStatus 400
$testResults += $result

# Phase 6: Summary Report
Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Blue
Write-Host "======================" -ForegroundColor Blue

$totalTests = $testResults.Count
$successfulTests = ($testResults | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $successfulTests

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "✅ Successful: $successfulTests" -ForegroundColor Green
Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! Backend is ready for frontend integration!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some tests failed. Issues need to be resolved before frontend integration." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor Blue
foreach ($result in $testResults) {
    $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "  $($result.Name): $status ($($result.Status))" -ForegroundColor $color
}

Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Blue
if ($failedTests -eq 0) {
    Write-Host "  1. ✅ Backend is fully functional" -ForegroundColor Green
    Write-Host "  2. ✅ Ready for frontend integration" -ForegroundColor Green
    Write-Host "  3. ✅ Deploy frontend with correct backend URLs" -ForegroundColor Green
} else {
    Write-Host "  1. ❌ Fix remaining backend issues" -ForegroundColor Red
    Write-Host "  2. ⏳ Re-test backend" -ForegroundColor Yellow
    Write-Host "  3. ⏳ Then proceed with frontend integration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Comprehensive backend testing completed!" -ForegroundColor Green
