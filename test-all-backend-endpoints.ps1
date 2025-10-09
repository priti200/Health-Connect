# HealthConnect Backend API Testing Script
# Tests all endpoints except authentication (which are confirmed working)

$baseUrl = "http://localhost:8081"
$testResults = @()

# Test credentials
$testPatientEmail = "patient.test@healthconnect.com"
$testDoctorEmail = "doctor.test@healthconnect.com"
$testPassword = "password123"

Write-Host "🏥 HealthConnect Backend API Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
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
            TimeoutSec = 10
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
            Message = "✅ Success"
            ResponseLength = $response.Content.Length
        }
        
        Write-Host "✅ $Name - Status: $($response.StatusCode)" -ForegroundColor Green
        return $result
        
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        $result = @{
            Name = $Name
            Url = $Url
            Method = $Method
            Status = $statusCode
            Success = $false
            Message = "❌ Error: $($_.Exception.Message)"
            ResponseLength = 0
        }
        
        Write-Host "❌ $Name - Status: $statusCode - Error: $($_.Exception.Message)" -ForegroundColor Red
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
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
        return $response.token
    } catch {
        Write-Host "❌ Failed to authenticate $Email" -ForegroundColor Red
        return $null
    }
}

Write-Host "🔐 Getting authentication tokens..." -ForegroundColor Yellow
$patientToken = Get-AuthToken -Email $testPatientEmail -Password $testPassword
$doctorToken = Get-AuthToken -Email $testDoctorEmail -Password $testPassword

if (-not $patientToken) {
    Write-Host "❌ Failed to get patient token. Exiting." -ForegroundColor Red
    exit 1
}

if (-not $doctorToken) {
    Write-Host "❌ Failed to get doctor token. Exiting." -ForegroundColor Red
    exit 1
}

$patientHeaders = @{ "Authorization" = "Bearer $patientToken" }
$doctorHeaders = @{ "Authorization" = "Bearer $doctorToken" }

Write-Host "✅ Authentication tokens obtained successfully" -ForegroundColor Green
Write-Host ""

# Test 1: Health Endpoints
Write-Host "🏥 Testing Health Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Main Health Check" -Url "$baseUrl/api/health"
$testResults += Test-Endpoint -Name "WebSocket Health" -Url "$baseUrl/api/health/websocket"
$testResults += Test-Endpoint -Name "Test Health" -Url "$baseUrl/api/test/health"

# Test 2: User Management Endpoints
Write-Host "`n👥 Testing User Management Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Current User (Patient)" -Url "$baseUrl/api/users/me" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Current User (Doctor)" -Url "$baseUrl/api/users/me" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$baseUrl/api/users/doctors"
$testResults += Test-Endpoint -Name "Get All Patients" -Url "$baseUrl/api/users/patients"

# Test 3: Doctor Endpoints
Write-Host "`n👨‍⚕️ Testing Doctor Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$baseUrl/api/doctors"
$testResults += Test-Endpoint -Name "Get Doctors by Specialization" -Url "$baseUrl/api/doctors?specialization=Cardiology"
$testResults += Test-Endpoint -Name "Get Doctor Specializations" -Url "$baseUrl/api/doctors/specializations"
$testResults += Test-Endpoint -Name "Debug All Doctors" -Url "$baseUrl/api/doctors/debug/all"

# Test 4: Appointment Endpoints
Write-Host "`n📅 Testing Appointment Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Patient Appointments" -Url "$baseUrl/api/appointments" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Doctor Appointments" -Url "$baseUrl/api/appointments" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Get Today's Appointments (Patient)" -Url "$baseUrl/api/appointments/today" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Today's Appointments (Doctor)" -Url "$baseUrl/api/appointments/today" -Headers $doctorHeaders

# Test 5: Chat Endpoints
Write-Host "`n💬 Testing Chat Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get User Chats (Patient)" -Url "$baseUrl/api/chats" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get User Chats (Doctor)" -Url "$baseUrl/api/chats" -Headers $doctorHeaders

# Test 6: Video Consultation Endpoints
Write-Host "`n📹 Testing Video Consultation Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Video Consultations (Patient)" -Url "$baseUrl/api/video-consultation" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Video Consultations (Doctor)" -Url "$baseUrl/api/video-consultation" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Video Consultation Health" -Url "$baseUrl/api/video-consultation/health"

# Test 7: AI Health Bot Endpoints
Write-Host "`n🤖 Testing AI Health Bot Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "AI Health Bot Health" -Url "$baseUrl/api/ai-health-bot/health"
$testResults += Test-Endpoint -Name "Get AI Conversations (Patient)" -Url "$baseUrl/api/ai-health-bot/conversations" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get AI Conversations Paginated" -Url "$baseUrl/api/ai-health-bot/conversations/paginated?page=0`&size=5" -Headers $patientHeaders

# Test 8: Insurance Endpoints
Write-Host "`n🏥 Testing Insurance Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Insurance Health" -Url "$baseUrl/api/insurance/health"
$testResults += Test-Endpoint -Name "Get Insurance Providers" -Url "$baseUrl/api/insurance/providers"
$testResults += Test-Endpoint -Name "Get Coverage Summary" -Url "$baseUrl/api/insurance/coverage-summary" -Headers $patientHeaders

# Test 9: Agora Token Endpoints
Write-Host "`n📞 Testing Agora Token Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Agora Config" -Url "$baseUrl/api/agora/config"
$testResults += Test-Endpoint -Name "Get Agora Token" -Url "$baseUrl/api/agora/token?channelName=test`&uid=123"

# Test 10: Gemini Proxy Endpoints
Write-Host "`n🧠 Testing Gemini Proxy Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Gemini Proxy Health" -Url "$baseUrl/api/gemini/health"

# Test 11: Internationalization Endpoints
Write-Host "`n🌍 Testing Internationalization Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Supported Languages" -Url "$baseUrl/api/i18n/languages"
$testResults += Test-Endpoint -Name "Get English Translations" -Url "$baseUrl/api/i18n/translations/en"
$testResults += Test-Endpoint -Name "I18n Health Check" -Url "$baseUrl/api/i18n/health"

# Test 12: Symptom Questionnaire Endpoints
Write-Host "`n📋 Testing Symptom Questionnaire Endpoints" -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get User Questionnaires" -Url "$baseUrl/api/symptom-questionnaire" -Headers $patientHeaders

Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Success }).Count
$totalCount = $testResults.Count
$failureCount = $totalCount - $successCount

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 2))%" -ForegroundColor Yellow

if ($failureCount -gt 0) {
    Write-Host "`n❌ Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Successful Tests:" -ForegroundColor Green
$testResults | Where-Object { $_.Success } | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Green
}

# Export results to JSON for further analysis
$testResults | ConvertTo-Json -Depth 3 | Out-File "test-results.json"
Write-Host "`n📄 Detailed results saved to test-results.json" -ForegroundColor Cyan
