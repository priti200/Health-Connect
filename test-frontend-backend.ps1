# Test the Backend URL that Frontend is Actually Calling

$frontendBackendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"

Write-Host "Testing Frontend's Backend URL" -ForegroundColor Cyan
Write-Host "Backend URL: $frontendBackendUrl" -ForegroundColor Yellow

# Test authentication first
Write-Host "Testing Authentication..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$frontendBackendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $response.token
    Write-Host "SUCCESS: Authentication working" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Authentication failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test AI Chat endpoint (the one failing in frontend)
Write-Host ""
Write-Host "Testing AI Chat Endpoint (the failing one)..." -ForegroundColor Yellow

$chatRequest = @{
    message = "Hello, I have a headache. What should I do?"
    conversationId = $null
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$frontendBackendUrl/api/ai-health-bot/chat" -Method POST -Body $chatRequest -Headers $headers
    Write-Host "SUCCESS: AI Chat endpoint working!" -ForegroundColor Green
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
    Write-Host "ERROR: AI Chat failed - Status: $statusCode" -ForegroundColor Red
    Write-Host "This explains why frontend is getting 403 errors!" -ForegroundColor Yellow
}

# Test other core endpoints
Write-Host ""
Write-Host "Testing Core Endpoints on Frontend's Backend..." -ForegroundColor Yellow

$endpoints = @(
    @{ Name = "Health Check"; Url = "$frontendBackendUrl/api/health"; Auth = $false },
    @{ Name = "Get Doctors"; Url = "$frontendBackendUrl/api/doctors"; Auth = $false },
    @{ Name = "Patient Appointments"; Url = "$frontendBackendUrl/api/appointments"; Auth = $true },
    @{ Name = "Patient Chats"; Url = "$frontendBackendUrl/api/chats"; Auth = $true },
    @{ Name = "AI Conversations"; Url = "$frontendBackendUrl/api/ai-health-bot/conversations"; Auth = $true }
)

foreach ($endpoint in $endpoints) {
    try {
        if ($endpoint.Auth) {
            $response = Invoke-RestMethod -Uri $endpoint.Url -Headers $headers
        } else {
            $response = Invoke-RestMethod -Uri $endpoint.Url
        }
        Write-Host "SUCCESS: $($endpoint.Name)" -ForegroundColor Green
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        Write-Host "ERROR: $($endpoint.Name) - Status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "SOLUTION:" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan
Write-Host "The frontend is calling an older backend deployment that has security issues." -ForegroundColor Yellow
Write-Host "We need to either:" -ForegroundColor Yellow
Write-Host "1. Update the frontend to use the working backend URL" -ForegroundColor Yellow
Write-Host "2. Deploy the fixed security config to the frontend's backend" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend Backend: $frontendBackendUrl" -ForegroundColor Red
Write-Host "Working Backend:  https://healthconnect-backend-dwa76nbkfq-uc.a.run.app" -ForegroundColor Green
