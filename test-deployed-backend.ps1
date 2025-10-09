# HealthConnect Deployed Backend API Testing Script

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"
$testResults = @()

Write-Host "Testing HealthConnect Deployed Backend API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow
Write-Host ""

# Function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [bool]$ExpectAuth = $false
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        $result = @{
            Name = $Name
            Url = $Url
            Method = $Method
            Status = $response.StatusCode
            Success = $true
            Message = "SUCCESS"
            ResponseLength = $response.Content.Length
        }
        
        Write-Host "SUCCESS: $Name - Status: $($response.StatusCode)" -ForegroundColor Green
        return $result
        
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        $result = @{
            Name = $Name
            Url = $Url
            Method = $Method
            Status = $statusCode
            Success = $false
            Message = "ERROR: $($_.Exception.Message)"
            ResponseLength = 0
        }
        
        Write-Host "ERROR: $Name - Status: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
        return $result
    }
}

# Function to authenticate and get token
function Get-AuthToken {
    param([string]$Email, [string]$Password)
    
    try {
        $loginBody = @{
            email = $Email
            password = $Password
        }
        
        $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
        return $response.token
    } catch {
        Write-Host "ERROR: Failed to authenticate $Email - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Health Check Endpoints
Write-Host "1. Testing Health Check Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Main Health Check" -Url "$backendUrl/api/health"
$testResults += Test-Endpoint -Name "WebSocket Health" -Url "$backendUrl/api/health/websocket"
$testResults += Test-Endpoint -Name "Test Health" -Url "$backendUrl/api/test/health"

# Test 2: Public Endpoints
Write-Host "`n2. Testing Public Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$backendUrl/api/doctors"
$testResults += Test-Endpoint -Name "Get Doctor Specializations" -Url "$backendUrl/api/doctors/specializations"
$testResults += Test-Endpoint -Name "Gemini Health Check" -Url "$backendUrl/api/gemini/health"
$testResults += Test-Endpoint -Name "Agora Config" -Url "$backendUrl/api/agora/config"
$testResults += Test-Endpoint -Name "Agora Token" -Url "$backendUrl/api/agora/token?channelName=test&uid=123"
$testResults += Test-Endpoint -Name "I18n Languages" -Url "$backendUrl/api/i18n/languages"
$testResults += Test-Endpoint -Name "I18n English Translations" -Url "$backendUrl/api/i18n/translations/en"
$testResults += Test-Endpoint -Name "Insurance Providers" -Url "$backendUrl/api/insurance/providers"
$testResults += Test-Endpoint -Name "Insurance Health" -Url "$backendUrl/api/insurance/health"

# Test 3: Authentication
Write-Host "`n3. Testing Authentication..." -ForegroundColor Yellow
$patientToken = Get-AuthToken -Email "patient.test@healthconnect.com" -Password "password123"
$doctorToken = Get-AuthToken -Email "doctor.test@healthconnect.com" -Password "password123"

if ($patientToken) {
    Write-Host "SUCCESS: Patient authentication successful" -ForegroundColor Green
} else {
    Write-Host "ERROR: Patient authentication failed" -ForegroundColor Red
}

if ($doctorToken) {
    Write-Host "SUCCESS: Doctor authentication successful" -ForegroundColor Green
} else {
    Write-Host "ERROR: Doctor authentication failed" -ForegroundColor Red
}

# Test 4: Authenticated Endpoints (if tokens are available)
if ($patientToken -and $doctorToken) {
    Write-Host "`n4. Testing Authenticated Endpoints..." -ForegroundColor Yellow
    
    $patientHeaders = @{ "Authorization" = "Bearer $patientToken" }
    $doctorHeaders = @{ "Authorization" = "Bearer $doctorToken" }
    
    # User endpoints
    $testResults += Test-Endpoint -Name "Get Current User (Patient)" -Url "$backendUrl/api/users/me" -Headers $patientHeaders
    $testResults += Test-Endpoint -Name "Get Current User (Doctor)" -Url "$backendUrl/api/users/me" -Headers $doctorHeaders
    
    # Appointment endpoints
    $testResults += Test-Endpoint -Name "Get Patient Appointments" -Url "$backendUrl/api/appointments" -Headers $patientHeaders
    $testResults += Test-Endpoint -Name "Get Doctor Appointments" -Url "$backendUrl/api/appointments" -Headers $doctorHeaders
    $testResults += Test-Endpoint -Name "Get Today's Appointments (Patient)" -Url "$backendUrl/api/appointments/today" -Headers $patientHeaders
    $testResults += Test-Endpoint -Name "Get Today's Appointments (Doctor)" -Url "$backendUrl/api/appointments/today" -Headers $doctorHeaders
    
    # Chat endpoints
    $testResults += Test-Endpoint -Name "Get Patient Chats" -Url "$backendUrl/api/chats" -Headers $patientHeaders
    $testResults += Test-Endpoint -Name "Get Doctor Chats" -Url "$backendUrl/api/chats" -Headers $doctorHeaders
    
    # Video consultation endpoints
    $testResults += Test-Endpoint -Name "Get Video Consultations (Patient)" -Url "$backendUrl/api/video-consultation" -Headers $patientHeaders
    $testResults += Test-Endpoint -Name "Get Video Consultations (Doctor)" -Url "$backendUrl/api/video-consultation" -Headers $doctorHeaders
    $testResults += Test-Endpoint -Name "Video Consultation Health" -Url "$backendUrl/api/video-consultation/health"
    
    # AI Health Bot endpoints
    $testResults += Test-Endpoint -Name "AI Health Bot Health" -Url "$backendUrl/api/ai-health-bot/health"
    $testResults += Test-Endpoint -Name "Get AI Conversations (Patient)" -Url "$backendUrl/api/ai-health-bot/conversations" -Headers $patientHeaders
    
    # Insurance endpoints (authenticated)
    $testResults += Test-Endpoint -Name "Get Coverage Summary" -Url "$backendUrl/api/insurance/coverage-summary" -Headers $patientHeaders
    
    # Symptom questionnaire endpoints
    $testResults += Test-Endpoint -Name "Get User Questionnaires" -Url "$backendUrl/api/symptom-questionnaire" -Headers $patientHeaders
} else {
    Write-Host "`n4. Skipping authenticated endpoint tests (authentication failed)" -ForegroundColor Red
}

# Test 5: Database and Data Initialization
Write-Host "`n5. Testing Data Availability..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get All Patients" -Url "$backendUrl/api/users/patients"
$testResults += Test-Endpoint -Name "Debug All Doctors" -Url "$backendUrl/api/doctors/debug/all"

# Summary
Write-Host "`n" -NoNewline
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Success }).Count
$totalCount = $testResults.Count
$failureCount = $totalCount - $successCount

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 2))%" -ForegroundColor Yellow

if ($failureCount -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Message)" -ForegroundColor Red
    }
}

Write-Host "`nSuccessful Tests:" -ForegroundColor Green
$testResults | Where-Object { $_.Success } | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Green
}

# Export results
$testResults | ConvertTo-Json -Depth 3 | Out-File "deployed-backend-test-results.json"
Write-Host "`nDetailed results saved to deployed-backend-test-results.json" -ForegroundColor Cyan

Write-Host "`nBackend URL: $backendUrl" -ForegroundColor Yellow
Write-Host "Testing completed!" -ForegroundColor Cyan
