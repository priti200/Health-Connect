# Comprehensive HealthConnect Backend API Testing Script
# Tests ALL endpoints found in the codebase

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"
$testResults = @()

Write-Host "Comprehensive HealthConnect Backend API Testing" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
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
        [bool]$ExpectSuccess = $true
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
            Category = "Working"
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
            Message = "ERROR: $($_.Exception.Message)"
            Category = if ($statusCode -eq 403) { "Security Issue" } elseif ($statusCode -eq 500) { "Server Error" } else { "Other Error" }
        }
        
        Write-Host "❌ $Name - Status: $statusCode" -ForegroundColor Red
        return $result
    }
}

# Authenticate
Write-Host "🔐 Authenticating..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    }
    
    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    $patientToken = $response.token
    Write-Host "✅ Patient authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Patient authentication failed" -ForegroundColor Red
    exit 1
}

try {
    $loginBody = @{
        email = "doctor.test@healthconnect.com"
        password = "password123"
    }
    
    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    $doctorToken = $response.token
    Write-Host "✅ Doctor authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Doctor authentication failed" -ForegroundColor Red
    exit 1
}

$patientHeaders = @{ "Authorization" = "Bearer $patientToken" }
$doctorHeaders = @{ "Authorization" = "Bearer $doctorToken" }

Write-Host ""

# 1. HEALTH CHECK ENDPOINTS
Write-Host "Testing Health Check Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Main Health Check" -Url "$backendUrl/api/health"
$testResults += Test-Endpoint -Name "WebSocket Health" -Url "$backendUrl/api/health/websocket"
$testResults += Test-Endpoint -Name "Test Health" -Url "$backendUrl/api/test/health"

# 2. AUTHENTICATION ENDPOINTS (already tested above)
Write-Host "Authentication Endpoints Already Tested" -ForegroundColor Yellow

# 3. USER MANAGEMENT ENDPOINTS
Write-Host "Testing User Management Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Current User (Patient)" -Url "$backendUrl/api/users/me" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Current User (Doctor)" -Url "$backendUrl/api/users/me" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$backendUrl/api/users/doctors"
$testResults += Test-Endpoint -Name "Get All Patients" -Url "$backendUrl/api/users/patients"

# 4. DOCTOR ENDPOINTS
Write-Host "`n👨‍⚕️ Testing Doctor Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get All Doctors" -Url "$backendUrl/api/doctors"
$testResults += Test-Endpoint -Name "Get Doctors by Specialization" -Url "$backendUrl/api/doctors?specialization=Cardiology"
$testResults += Test-Endpoint -Name "Get Doctor Specializations" -Url "$backendUrl/api/doctors/specializations"
$testResults += Test-Endpoint -Name "Debug All Doctors" -Url "$backendUrl/api/doctors/debug/all"

# 5. APPOINTMENT ENDPOINTS
Write-Host "`n📅 Testing Appointment Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Patient Appointments" -Url "$backendUrl/api/appointments" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Doctor Appointments" -Url "$backendUrl/api/appointments" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Get Today's Appointments (Patient)" -Url "$backendUrl/api/appointments/today" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Today's Appointments (Doctor)" -Url "$backendUrl/api/appointments/today" -Headers $doctorHeaders

# 6. CHAT ENDPOINTS
Write-Host "`n💬 Testing Chat Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Patient Chats" -Url "$backendUrl/api/chats" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Doctor Chats" -Url "$backendUrl/api/chats" -Headers $doctorHeaders

# 7. VIDEO CONSULTATION ENDPOINTS
Write-Host "`n📹 Testing Video Consultation Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Video Consultations (Patient)" -Url "$backendUrl/api/video-consultation" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get Video Consultations (Doctor)" -Url "$backendUrl/api/video-consultation" -Headers $doctorHeaders
$testResults += Test-Endpoint -Name "Video Consultation Health" -Url "$backendUrl/api/video-consultation/health"

# 8. AI HEALTH BOT ENDPOINTS
Write-Host "`n🤖 Testing AI Health Bot Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "AI Health Bot Health" -Url "$backendUrl/api/ai-health-bot/health"
$testResults += Test-Endpoint -Name "Get AI Conversations (Patient)" -Url "$backendUrl/api/ai-health-bot/conversations" -Headers $patientHeaders
$testResults += Test-Endpoint -Name "Get AI Conversations Paginated" -Url "$backendUrl/api/ai-health-bot/conversations/paginated?page=0&size=5" -Headers $patientHeaders

# 9. AGORA TOKEN ENDPOINTS
Write-Host "`n📞 Testing Agora Token Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Agora Config" -Url "$backendUrl/api/agora/config"
$testResults += Test-Endpoint -Name "Get Agora Token" -Url "$backendUrl/api/agora/token?channelName=test&uid=123"

# 10. GEMINI PROXY ENDPOINTS
Write-Host "`n🧠 Testing Gemini Proxy Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Gemini Proxy Health" -Url "$backendUrl/api/gemini/health"

# 11. INTERNATIONALIZATION ENDPOINTS
Write-Host "`n🌍 Testing Internationalization Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get Supported Languages" -Url "$backendUrl/api/i18n/languages"
$testResults += Test-Endpoint -Name "Get English Translations" -Url "$backendUrl/api/i18n/translations/en"
$testResults += Test-Endpoint -Name "I18n Health Check" -Url "$backendUrl/api/i18n/health"

# 12. INSURANCE ENDPOINTS
Write-Host "`n🏥 Testing Insurance Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Insurance Health" -Url "$backendUrl/api/insurance/health"
$testResults += Test-Endpoint -Name "Get Insurance Providers" -Url "$backendUrl/api/insurance/providers"
$testResults += Test-Endpoint -Name "Get Coverage Summary" -Url "$backendUrl/api/insurance/coverage-summary" -Headers $patientHeaders

# 13. SYMPTOM QUESTIONNAIRE ENDPOINTS
Write-Host "`n📋 Testing Symptom Questionnaire Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get User Questionnaires" -Url "$backendUrl/api/symptom-questionnaire" -Headers $patientHeaders

# 14. DEBUG ENDPOINTS
Write-Host "`n🔧 Testing Debug Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Get All Users (Debug)" -Url "$backendUrl/api/debug/users"

# 15. TEST ENDPOINTS
Write-Host "`n🧪 Testing Test Endpoints..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Test Info" -Url "$backendUrl/api/test/info" -Headers $patientHeaders

Write-Host ""
Write-Host "📊 COMPREHENSIVE TEST RESULTS" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

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
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 2))%" -ForegroundColor $(if ($successCount -ge ($totalCount * 0.8)) { "Green" } else { "Yellow" })

# Group results by category
$categories = $testResults | Group-Object Category
foreach ($category in $categories) {
    Write-Host "`n$($category.Name) ($($category.Count) endpoints):" -ForegroundColor $(if ($category.Name -eq "Working") { "Green" } else { "Red" })
    $category.Group | ForEach-Object {
        $color = if ($_.Success) { "Green" } else { "Red" }
        Write-Host "  - $($_.Name)" -ForegroundColor $color
    }
}

# Export results
$testResults | ConvertTo-Json -Depth 3 | Out-File "comprehensive-test-results.json"
Write-Host "`n📄 Detailed results saved to comprehensive-test-results.json" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
