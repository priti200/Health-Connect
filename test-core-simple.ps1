# HealthConnect Core Features Test

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"

Write-Host "Testing HealthConnect Core Features" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow

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

# Test Core Features
Write-Host ""
Write-Host "Testing Core Features..." -ForegroundColor Yellow

# 1. CHAT SYSTEM
Write-Host "1. CHAT SYSTEM:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/chats" -Headers $patientHeaders
    Write-Host "   SUCCESS: Patient chats" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Patient chats" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/chats" -Headers $doctorHeaders
    Write-Host "   SUCCESS: Doctor chats" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Doctor chats" -ForegroundColor Red
}

# 2. APPOINTMENT SYSTEM
Write-Host "2. APPOINTMENT SYSTEM:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/appointments" -Headers $patientHeaders
    Write-Host "   SUCCESS: Patient appointments" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Patient appointments" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/appointments" -Headers $doctorHeaders
    Write-Host "   SUCCESS: Doctor appointments" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Doctor appointments" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/doctors"
    Write-Host "   SUCCESS: Get all doctors" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Get all doctors" -ForegroundColor Red
}

# 3. AI CHAT BOT
Write-Host "3. AI CHAT BOT:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/ai-health-bot/conversations" -Headers $patientHeaders
    Write-Host "   SUCCESS: AI conversations" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: AI conversations" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/gemini/health"
    Write-Host "   SUCCESS: Gemini AI integration" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Gemini AI integration" -ForegroundColor Red
}

# 4. PRESCRIPTION ANALYZER
Write-Host "4. PRESCRIPTION ANALYZER:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant" -Method GET
    Write-Host "   SUCCESS: Gemini Medical Assistant API accessible" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Gemini Medical Assistant API not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "Core Features Test Completed!" -ForegroundColor Green
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
