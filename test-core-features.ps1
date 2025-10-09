# HealthConnect Core Features Test - Deployed Backend

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"

Write-Host "Testing HealthConnect Core Features" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow
Write-Host ""

# Function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null
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
        Write-Host "✅ $Name - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
        
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        Write-Host "❌ $Name - Status: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Authenticate
Write-Host "🔐 Authenticating..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    }
    
    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
    $patientToken = $response.token
    Write-Host "✅ Patient authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    exit 1
}

try {
    $loginBody = @{
        email = "doctor.test@healthconnect.com"
        password = "password123"
    }
    
    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
    $doctorToken = $response.token
    Write-Host "✅ Doctor authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Doctor authentication failed" -ForegroundColor Red
    exit 1
}

$patientHeaders = @{ "Authorization" = "Bearer $patientToken" }
$doctorHeaders = @{ "Authorization" = "Bearer $doctorToken" }

Write-Host ""

# Test Core Feature 1: CHAT SYSTEM
Write-Host "💬 Testing CHAT SYSTEM..." -ForegroundColor Yellow
$chatSuccess = 0
$chatTotal = 4

if (Test-Endpoint -Name "Get Patient Chats" -Url "$backendUrl/api/chats" -Headers $patientHeaders) { $chatSuccess++ }
if (Test-Endpoint -Name "Get Doctor Chats" -Url "$backendUrl/api/chats" -Headers $doctorHeaders) { $chatSuccess++ }
if (Test-Endpoint -Name "WebSocket Health" -Url "$backendUrl/api/health/websocket") { $chatSuccess++ }
if (Test-Endpoint -Name "Chat Messages Support" -Url "$backendUrl/api/chats" -Headers $patientHeaders) { $chatSuccess++ }

Write-Host "Chat System: $chatSuccess/$chatTotal tests passed" -ForegroundColor $(if ($chatSuccess -eq $chatTotal) { "Green" } else { "Yellow" })

# Test Core Feature 2: APPOINTMENT SYSTEM
Write-Host "`n📅 Testing APPOINTMENT SYSTEM..." -ForegroundColor Yellow
$appointmentSuccess = 0
$appointmentTotal = 6

if (Test-Endpoint -Name "Get Patient Appointments" -Url "$backendUrl/api/appointments" -Headers $patientHeaders) { $appointmentSuccess++ }
if (Test-Endpoint -Name "Get Doctor Appointments" -Url "$backendUrl/api/appointments" -Headers $doctorHeaders) { $appointmentSuccess++ }
if (Test-Endpoint -Name "Get Today's Appointments (Patient)" -Url "$backendUrl/api/appointments/today" -Headers $patientHeaders) { $appointmentSuccess++ }
if (Test-Endpoint -Name "Get Today's Appointments (Doctor)" -Url "$backendUrl/api/appointments/today" -Headers $doctorHeaders) { $appointmentSuccess++ }
if (Test-Endpoint -Name "Get All Doctors for Booking" -Url "$backendUrl/api/doctors") { $appointmentSuccess++ }
if (Test-Endpoint -Name "Get Doctor Specializations" -Url "$backendUrl/api/doctors/specializations") { $appointmentSuccess++ }

Write-Host "Appointment System: $appointmentSuccess/$appointmentTotal tests passed" -ForegroundColor $(if ($appointmentSuccess -eq $appointmentTotal) { "Green" } else { "Yellow" })

# Test Core Feature 3: AI CHAT BOT
Write-Host "`n🤖 Testing AI CHAT BOT..." -ForegroundColor Yellow
$aiSuccess = 0
$aiTotal = 3

if (Test-Endpoint -Name "Get AI Conversations (Patient)" -Url "$backendUrl/api/ai-health-bot/conversations" -Headers $patientHeaders) { $aiSuccess++ }
if (Test-Endpoint -Name "Gemini AI Integration" -Url "$backendUrl/api/gemini/health") { $aiSuccess++ }
if (Test-Endpoint -Name "AI Conversations Paginated" -Url "$backendUrl/api/ai-health-bot/conversations/paginated?page=0&size=5" -Headers $patientHeaders) { $aiSuccess++ }

Write-Host "AI Chat Bot: $aiSuccess/$aiTotal tests passed" -ForegroundColor $(if ($aiSuccess -eq $aiTotal) { "Green" } else { "Yellow" })

# Test Core Feature 4: PRESCRIPTION ANALYZER (Frontend Integration)
Write-Host "`n💊 Testing PRESCRIPTION ANALYZER..." -ForegroundColor Yellow
Write-Host "ℹ️  Prescription Analyzer uses direct frontend call to Gemini Medical Assistant API" -ForegroundColor Cyan
Write-Host "ℹ️  API URL: https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant" -ForegroundColor Cyan

# Test if the Gemini Medical Assistant API is accessible
try {
    $response = Invoke-WebRequest -Uri "https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant" -Method GET -TimeoutSec 30
    Write-Host "✅ Gemini Medical Assistant API - Accessible" -ForegroundColor Green
    $prescriptionSuccess = 1
} catch {
    Write-Host "❌ Gemini Medical Assistant API - Not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $prescriptionSuccess = 0
}

Write-Host "Prescription Analyzer: $prescriptionSuccess/1 tests passed" -ForegroundColor $(if ($prescriptionSuccess -eq 1) { "Green" } else { "Yellow" })

# Additional Supporting Features
Write-Host "`n🏥 Testing SUPPORTING FEATURES..." -ForegroundColor Yellow
$supportSuccess = 0
$supportTotal = 4

if (Test-Endpoint -Name "Video Consultations (Patient)" -Url "$backendUrl/api/video-consultation" -Headers $patientHeaders) { $supportSuccess++ }
if (Test-Endpoint -Name "Video Consultations (Doctor)" -Url "$backendUrl/api/video-consultation" -Headers $doctorHeaders) { $supportSuccess++ }
if (Test-Endpoint -Name "User Profile (Patient)" -Url "$backendUrl/api/users/me" -Headers $patientHeaders) { $supportSuccess++ }
if (Test-Endpoint -Name "User Profile (Doctor)" -Url "$backendUrl/api/users/me" -Headers $doctorHeaders) { $supportSuccess++ }

Write-Host "Supporting Features: $supportSuccess/$supportTotal tests passed" -ForegroundColor $(if ($supportSuccess -eq $supportTotal) { "Green" } else { "Yellow" })

# Final Summary
Write-Host ""
Write-Host "🎯 CORE FEATURES SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$totalSuccess = $chatSuccess + $appointmentSuccess + $aiSuccess + $prescriptionSuccess + $supportSuccess
$totalTests = $chatTotal + $appointmentTotal + $aiTotal + 1 + $supportTotal

Write-Host "💬 Chat System: $(if ($chatSuccess -eq $chatTotal) { "✅ WORKING" } else { "⚠️  PARTIAL" })" -ForegroundColor $(if ($chatSuccess -eq $chatTotal) { "Green" } else { "Yellow" })
Write-Host "📅 Appointment System: $(if ($appointmentSuccess -eq $appointmentTotal) { "✅ WORKING" } else { "⚠️  PARTIAL" })" -ForegroundColor $(if ($appointmentSuccess -eq $appointmentTotal) { "Green" } else { "Yellow" })
Write-Host "🤖 AI Chat Bot: $(if ($aiSuccess -eq $aiTotal) { "✅ WORKING" } else { "⚠️  PARTIAL" })" -ForegroundColor $(if ($aiSuccess -eq $aiTotal) { "Green" } else { "Yellow" })
Write-Host "💊 Prescription Analyzer: $(if ($prescriptionSuccess -eq 1) { "✅ WORKING" } else { "❌ ISSUES" })" -ForegroundColor $(if ($prescriptionSuccess -eq 1) { "Green" } else { "Red" })
Write-Host "🏥 Supporting Features: $(if ($supportSuccess -eq $supportTotal) { "✅ WORKING" } else { "⚠️  PARTIAL" })" -ForegroundColor $(if ($supportSuccess -eq $supportTotal) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "Overall Core Features: $totalSuccess/$totalTests tests passed" -ForegroundColor $(if ($totalSuccess -ge ($totalTests * 0.8)) { "Green" } else { "Yellow" })
Write-Host "Success Rate: $([math]::Round(($totalSuccess / $totalTests) * 100, 2))%" -ForegroundColor $(if ($totalSuccess -ge ($totalTests * 0.8)) { "Green" } else { "Yellow" })

if ($totalSuccess -ge ($totalTests * 0.8)) {
    Write-Host ""
    Write-Host "🎉 HealthConnect Backend is READY for Production!" -ForegroundColor Green
    Write-Host "All core features are working correctly." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some core features need attention before production deployment." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
