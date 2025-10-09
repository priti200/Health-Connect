# Comprehensive HealthConnect Backend API Testing Script

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"
$testResults = @()

Write-Host "Comprehensive HealthConnect Backend API Testing" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow

# Function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{}
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        $response = Invoke-WebRequest @params
        
        $result = @{
            Name = $Name
            Status = $response.StatusCode
            Success = $true
            Category = "Working"
        }
        
        Write-Host "SUCCESS: $Name - Status: $($response.StatusCode)" -ForegroundColor Green
        return $result
        
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        $result = @{
            Name = $Name
            Status = $statusCode
            Success = $false
            Category = if ($statusCode -eq 403) { "Security Issue" } elseif ($statusCode -eq 500) { "Server Error" } else { "Other Error" }
        }
        
        Write-Host "ERROR: $Name - Status: $statusCode" -ForegroundColor Red
        return $result
    }
}

# Authenticate
Write-Host "Authenticating..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $patientToken = $response.token
    Write-Host "SUCCESS: Patient authentication" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Patient authentication failed" -ForegroundColor Red
    exit 1
}

try {
    $loginBody = @{
        email = "doctor.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $doctorToken = $response.token
    Write-Host "SUCCESS: Doctor authentication" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Doctor authentication failed" -ForegroundColor Red
    exit 1
}

$patientHeaders = @{ "Authorization" = "Bearer $patientToken" }
$doctorHeaders = @{ "Authorization" = "Bearer $doctorToken" }

Write-Host ""
Write-Host "Testing All Endpoints..." -ForegroundColor Yellow

# HEALTH CHECK ENDPOINTS
$testResults += Test-Endpoint -Name "Main Health Check" -Url "$backendUrl/api/health"
$testResults += Test-Endpoint -Name "WebSocket Health" -Url "$backendUrl/api/health/websocket"
$testResults += Test-Endpoint -Name "Test Health" -Url "$backendUrl/api/test/health"

# USER MANAGEMENT ENDPOINTS
$testResults += Test-Endpoint -Name "Get Current User (Patient)" -Url "$backendUrl/api/users/me" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Current User (Doctor)" -Url "$backendUrl/api/users/me" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$backendUrl/api/users/doctors"
$testResults += Test-Endpoint -Name "Get All Patients" -Url "$backendUrl/api/users/patients"

# DOCTOR ENDPOINTS
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$backendUrl/api/doctors"
$testResults += Test-Endpoint -Name "Get Doctor Specializations" -Url "$backendUrl/api/doctors/specializations"
$testResults += Test-Endpoint -Name "Debug All Doctors" -Url "$backendUrl/api/doctors/debug/all"

# APPOINTMENT ENDPOINTS
$testResults += Test-Endpoint -Name "Get Patient Appointments" -Url "$backendUrl/api/appointments" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Doctor Appointments" -Url "$backendUrl/api/appointments" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Get Today's Appointments (Patient)" -Url "$backendUrl/api/appointments/today" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Today's Appointments (Doctor)" -Url "$backendUrl/api/appointments/today" -Headers $doctorHeaders

# CHAT ENDPOINTS
$testResults += Test-Endpoint -Name "Get Patient Chats" -Url "$backendUrl/api/chats" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Doctor Chats" -Url "$backendUrl/api/chats" -Headers $doctorHeaders

# VIDEO CONSULTATION ENDPOINTS
$testResults += Test-Endpoint -Name "Get Video Consultations (Patient)" -Url "$backendUrl/api/video-consultation" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Video Consultations (Doctor)" -Url "$backendUrl/api/video-consultation" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Video Consultation Health" -Url "$backendUrl/api/video-consultation/health"

# AI HEALTH BOT ENDPOINTS
$testResults += Test-Endpoint -Name "AI Health Bot Health" -Url "$backendUrl/api/ai-health-bot/health"
$testResults += Test-Endpoint -Name "Get AI Conversations (Patient)" -Url "$backendUrl/api/ai-health-bot/conversations" -Headers $patientHeaders

# AGORA TOKEN ENDPOINTS
$testResults += Test-Endpoint -Name "Get Agora Config" -Url "$backendUrl/api/agora/config"
$testResults += Test-Endpoint -Name "Get Agora Token" -Url "$backendUrl/api/agora/token?channelName=test&uid=123"

# GEMINI PROXY ENDPOINTS
$testResults += Test-Endpoint -Name "Gemini Proxy Health" -Url "$backendUrl/api/gemini/health"

# INTERNATIONALIZATION ENDPOINTS
$testResults += Test-Endpoint -Name "Get Supported Languages" -Url "$backendUrl/api/i18n/languages"
$testResults += Test-Endpoint -Name "Get English Translations" -Url "$backendUrl/api/i18n/translations/en"

# INSURANCE ENDPOINTS
$testResults += Test-Endpoint -Name "Insurance Health" -Url "$backendUrl/api/insurance/health"
$testResults += Test-Endpoint -Name "Get Insurance Providers" -Url "$backendUrl/api/insurance/providers"
$testResults += Test-Endpoint -Name "Get Coverage Summary" -Url "$backendUrl/api/insurance/coverage-summary" -Headers $patientHeaders

# SYMPTOM QUESTIONNAIRE ENDPOINTS
$testResults += Test-Endpoint -Name "Get User Questionnaires" -Url "$backendUrl/api/symptom-questionnaire" -Headers $patientHeaders

# DEBUG ENDPOINTS
$testResults += Test-Endpoint -Name "Get All Users (Debug)" -Url "$backendUrl/api/debug/users"

Write-Host ""
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Success }).Count
$totalCount = $testResults.Count
$failureCount = $totalCount - $successCount
$securityIssues = ($testResults | Where-Object { $_.Category -eq "Security Issue" }).Count
$serverErrors = ($testResults | Where-Object { $_.Category -eq "Server Error" }).Count

Write-Host "Total Endpoints Tested: $totalCount" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red
Write-Host "  - Security Issues (403): $securityIssues" -ForegroundColor Yellow
Write-Host "  - Server Errors (500): $serverErrors" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 2))%" -ForegroundColor Yellow

Write-Host ""
Write-Host "CORE FEATURES STATUS:" -ForegroundColor Cyan
$coreFeatures = @(
    "Get Patient Chats",
    "Get Doctor Chats", 
    "Get Patient Appointments",
    "Get Doctor Appointments",
    "Get AI Conversations (Patient)",
    "Gemini Proxy Health"
)

foreach ($feature in $coreFeatures) {
    $result = $testResults | Where-Object { $_.Name -eq $feature }
    if ($result -and $result.Success) {
        Write-Host "SUCCESS: $feature" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $feature" -ForegroundColor Red
    }
}

if ($securityIssues -gt 0) {
    Write-Host ""
    Write-Host "SECURITY ISSUES (403 Forbidden):" -ForegroundColor Red
    $testResults | Where-Object { $_.Category -eq "Security Issue" } | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "These endpoints need to be added to SecurityConfig permitAll() list" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
