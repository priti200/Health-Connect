# Comprehensive HealthConnect Backend API Testing

Write-Host "🔍 HealthConnect Comprehensive Backend API Testing" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [bool]$RequiresAuth = $false
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        
        $result = @{
            Name = $Name
            Status = $response.StatusCode
            Success = $true
            Error = $null
            ResponseLength = $response.Content.Length
        }
        
        Write-Host "  ✅ $Name`: $($response.StatusCode)" -ForegroundColor Green
        
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "Unknown" }
        
        $result = @{
            Name = $Name
            Status = $statusCode
            Success = $false
            Error = $_.Exception.Message
            ResponseLength = 0
        }
        
        if ($statusCode -eq 401 -and $RequiresAuth) {
            Write-Host "  ⚠️ $Name`: 401 (Expected - Requires Auth)" -ForegroundColor Yellow
            $result.Success = $true  # 401 is expected for auth-required endpoints
        } elseif ($statusCode -eq 404) {
            Write-Host "  ❌ $Name`: 404 (Not Found)" -ForegroundColor Red
        } else {
            Write-Host "  ❌ $Name`: $statusCode" -ForegroundColor Red
        }
    }
    
    return $result
}

# Step 1: Test Public Endpoints (No Auth Required)
Write-Host ""
Write-Host "1. Testing Public Endpoints..." -ForegroundColor Yellow

$publicTests = @(
    @{ Name = "Health Check"; Url = "$backendUrl/api/health" },
    @{ Name = "WebSocket Health"; Url = "$backendUrl/api/health/websocket" },
    @{ Name = "Test Health"; Url = "$backendUrl/api/test/health" },
    @{ Name = "Get All Doctors"; Url = "$backendUrl/api/doctors" },
    @{ Name = "Get Doctor Specializations"; Url = "$backendUrl/api/doctors/specializations" },
    @{ Name = "Gemini Proxy Health"; Url = "$backendUrl/api/gemini/health" }
)

foreach ($test in $publicTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url
    $testResults += $result
}

# Step 2: Test Authentication Endpoints
Write-Host ""
Write-Host "2. Testing Authentication Endpoints..." -ForegroundColor Yellow

# Test patient login
$loginBody = @{
    email = "patient.test@healthconnect.com"
    password = "password123"
} | ConvertTo-Json

$loginResult = Test-Endpoint -Name "Patient Login" -Url "$backendUrl/api/auth/login" -Method "POST" -Body $loginBody
$testResults += $loginResult

# Get auth token for subsequent tests
$authToken = $null
if ($loginResult.Success) {
    try {
        $loginResponse = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType 'application/json'
        $loginData = $loginResponse.Content | ConvertFrom-Json
        $authToken = $loginData.token
        Write-Host "  🔑 Auth token obtained successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to get auth token" -ForegroundColor Red
    }
}

# Test doctor login
$doctorLoginBody = @{
    email = "doctor.smith@healthconnect.com"
    password = "password123"
} | ConvertTo-Json

$doctorLoginResult = Test-Endpoint -Name "Doctor Login" -Url "$backendUrl/api/auth/login" -Method "POST" -Body $doctorLoginBody
$testResults += $doctorLoginResult

# Step 3: Test Authenticated Endpoints
Write-Host ""
Write-Host "3. Testing Authenticated Endpoints..." -ForegroundColor Yellow

$authHeaders = @{}
if ($authToken) {
    $authHeaders = @{
        'Authorization' = "Bearer $authToken"
        'Content-Type' = 'application/json'
    }
}

$authTests = @(
    @{ Name = "Get Current User"; Url = "$backendUrl/api/users/me"; RequiresAuth = $true },
    @{ Name = "Get User Chats"; Url = "$backendUrl/api/chats"; RequiresAuth = $true },
    @{ Name = "Get User Appointments"; Url = "$backendUrl/api/appointments"; RequiresAuth = $true },
    @{ Name = "Get Today's Appointments"; Url = "$backendUrl/api/appointments/today"; RequiresAuth = $true },
    @{ Name = "Get Video Consultations"; Url = "$backendUrl/api/video-consultation"; RequiresAuth = $true },
    @{ Name = "AI Health Bot Health"; Url = "$backendUrl/api/ai-health-bot/health"; RequiresAuth = $true },
    @{ Name = "Get AI Conversations"; Url = "$backendUrl/api/ai-health-bot/conversations"; RequiresAuth = $true }
)

foreach ($test in $authTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -Headers $authHeaders -RequiresAuth $test.RequiresAuth
    $testResults += $result
}

# Step 4: Test Specific Problematic Endpoints
Write-Host ""
Write-Host "4. Testing Problematic Endpoints..." -ForegroundColor Yellow

$problemTests = @(
    @{ Name = "Doctor Time Slots (ID 1)"; Url = "$backendUrl/api/doctors/1/time-slots?date=2025-06-20" },
    @{ Name = "Doctor Time Slots (ID 8)"; Url = "$backendUrl/api/doctors/8/time-slots?date=2025-06-20" },
    @{ Name = "Doctor by ID (ID 1)"; Url = "$backendUrl/api/doctors/1" },
    @{ Name = "Doctor by ID (ID 8)"; Url = "$backendUrl/api/doctors/8" },
    @{ Name = "Insurance Endpoints"; Url = "$backendUrl/api/insurance" },
    @{ Name = "Digital Prescription"; Url = "$backendUrl/api/digital-prescription" }
)

foreach ($test in $problemTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -Headers $authHeaders -RequiresAuth $true
    $testResults += $result
}

# Step 5: Test POST Endpoints
Write-Host ""
Write-Host "5. Testing POST Endpoints..." -ForegroundColor Yellow

# Test appointment creation
$appointmentBody = @{
    doctorId = 1
    date = "2025-06-21"
    startTime = "14:00"
    endTime = "15:00"
    type = "VIDEO_CONSULTATION"
    reasonForVisit = "Test appointment"
} | ConvertTo-Json

$postResult = Test-Endpoint -Name "Create Appointment" -Url "$backendUrl/api/appointments" -Method "POST" -Body $appointmentBody -Headers $authHeaders -RequiresAuth $true
$testResults += $postResult

# Test Gemini Proxy
$geminiBody = @{
    image_base64 = "test_image_data"
} | ConvertTo-Json

$geminiResult = Test-Endpoint -Name "Gemini Proxy Analyze" -Url "$backendUrl/api/gemini/analyze" -Method "POST" -Body $geminiBody
$testResults += $geminiResult

# Step 6: Summary Report
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

Write-Host "📋 Detailed Results:" -ForegroundColor Blue
foreach ($result in $testResults) {
    $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "  $($result.Name): $status ($($result.Status))" -ForegroundColor $color
    if (-not $result.Success -and $result.Error) {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔧 Issues Found:" -ForegroundColor Blue
$failedResults = $testResults | Where-Object { -not $_.Success }
if ($failedResults.Count -eq 0) {
    Write-Host "  🎉 No issues found! All endpoints working correctly." -ForegroundColor Green
} else {
    foreach ($failed in $failedResults) {
        Write-Host "  • $($failed.Name): $($failed.Status)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
