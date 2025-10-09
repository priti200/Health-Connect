# Working HealthConnect Backend Testing Script

Write-Host "🔍 HealthConnect Backend Testing" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"

function Test-API {
    param($name, $url, $method = "GET", $body = $null, $headers = @{})
    
    try {
        if ($method -eq "POST" -and $body) {
            $response = Invoke-WebRequest -Uri $url -Method $method -Body $body -Headers $headers -ContentType 'application/json'
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers
        }
        Write-Host "  ✅ $name`: $($response.StatusCode)" -ForegroundColor Green
        return @{ Success = $true; Status = $response.StatusCode; Content = $response.Content }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "Unknown" }
        if ($statusCode -eq 401) {
            Write-Host "  🔐 $name`: 401 (Auth Required)" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "  ❌ $name`: 404 (Not Found)" -ForegroundColor Red
        } else {
            Write-Host "  ❌ $name`: $statusCode" -ForegroundColor Red
        }
        return @{ Success = $false; Status = $statusCode; Content = $null }
    }
}

# Phase 1: Public Endpoints
Write-Host ""
Write-Host "📋 Phase 1: Testing Public Endpoints" -ForegroundColor Yellow

$result1 = Test-API "Health Check" "$backendUrl/api/health"
$result2 = Test-API "Test Health" "$backendUrl/api/test/health"
$result3 = Test-API "Get All Doctors" "$backendUrl/api/doctors"
$result4 = Test-API "Doctor Specializations" "$backendUrl/api/doctors/specializations"
$result5 = Test-API "Gemini Health" "$backendUrl/api/gemini/health"
$result6 = Test-API "Debug All Doctors" "$backendUrl/api/doctors/debug/all"

# Phase 2: Authentication
Write-Host ""
Write-Host "🔐 Phase 2: Testing Authentication" -ForegroundColor Yellow

$loginBody = '{"email":"patient.test@healthconnect.com","password":"password123"}'
$loginResult = Test-API "Patient Login" "$backendUrl/api/auth/login" "POST" $loginBody

# Get auth token
$authToken = $null
if ($loginResult.Success) {
    try {
        $loginData = $loginResult.Content | ConvertFrom-Json
        $authToken = $loginData.token
        Write-Host "  🔑 Auth token obtained successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to parse auth token" -ForegroundColor Red
    }
}

# Phase 3: Authenticated Endpoints
Write-Host ""
Write-Host "🔒 Phase 3: Testing Authenticated Endpoints" -ForegroundColor Yellow

$authHeaders = @{}
if ($authToken) {
    $authHeaders = @{'Authorization' = "Bearer $authToken"}
}

$result7 = Test-API "Get Current User" "$backendUrl/api/users/me" "GET" $null $authHeaders
$result8 = Test-API "Get Appointments" "$backendUrl/api/appointments" "GET" $null $authHeaders
$result9 = Test-API "Get Chats" "$backendUrl/api/chats" "GET" $null $authHeaders
$result10 = Test-API "Video Consultations" "$backendUrl/api/video-consultation" "GET" $null $authHeaders
$result11 = Test-API "AI Health Bot Health" "$backendUrl/api/ai-health-bot/health" "GET" $null $authHeaders
$result12 = Test-API "Insurance Health" "$backendUrl/api/insurance/health" "GET" $null $authHeaders

# Phase 4: Doctor Time Slots (The Previously Problematic Endpoint)
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
        $result = Test-API "Doctor $doctorId Time Slots" "$backendUrl/api/doctors/$doctorId/time-slots?date=2025-06-21"
    }
    
} catch {
    Write-Host "  ❌ Failed to get doctors list" -ForegroundColor Red
}

# Phase 5: Gemini Proxy Testing
Write-Host ""
Write-Host "🤖 Phase 5: Testing Gemini Proxy" -ForegroundColor Yellow

# Test with valid base64 (1x1 pixel PNG)
$validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
$geminiValidBody = "{`"image_base64`":`"$validBase64`"}"
$result13 = Test-API "Gemini Analyze (Valid)" "$backendUrl/api/gemini/analyze" "POST" $geminiValidBody

# Test with invalid data
$geminiInvalidBody = '{"image_base64":"invalid_data"}'
$result14 = Test-API "Gemini Analyze (Invalid)" "$backendUrl/api/gemini/analyze" "POST" $geminiInvalidBody

# Phase 6: Summary
Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Blue
Write-Host "======================" -ForegroundColor Blue

$allResults = @($result1, $result2, $result3, $result4, $result5, $result6, $loginResult, $result7, $result8, $result9, $result10, $result11, $result12, $result13, $result14)
$successCount = ($allResults | Where-Object { $_.Success }).Count
$totalCount = $allResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $($totalCount - $successCount)" -ForegroundColor Red

if ($successCount -eq $totalCount) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED! Backend is fully functional!" -ForegroundColor Green
    Write-Host "✅ Ready for frontend integration!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Some tests failed. Check the results above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Backend testing completed!" -ForegroundColor Green
