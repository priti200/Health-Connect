# Test AI Chat Bot Endpoint with Authentication

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"

Write-Host "Testing AI Chat Bot Endpoint with Authentication" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow

# Authenticate first
Write-Host "Authenticating..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $response.token
    Write-Host "SUCCESS: Authentication successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Authentication failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test AI Chat endpoint
Write-Host ""
Write-Host "Testing AI Chat Endpoint..." -ForegroundColor Yellow

$chatRequest = @{
    message = "Hello, I have a headache. What should I do?"
    conversationId = $null
} | ConvertTo-Json

try {
    Write-Host "Sending chat request..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$backendUrl/api/ai-health-bot/chat" -Method POST -Body $chatRequest -Headers $headers
    Write-Host "SUCCESS: AI Chat endpoint working!" -ForegroundColor Green
    Write-Host "Response: $($response.response)" -ForegroundColor Green
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
    Write-Host "ERROR: AI Chat failed - Status: $statusCode" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Check if it's a 403 error
    if ($statusCode -eq "Forbidden") {
        Write-Host ""
        Write-Host "403 Forbidden Error Analysis:" -ForegroundColor Yellow
        Write-Host "- The endpoint requires authentication" -ForegroundColor Yellow
        Write-Host "- Frontend must send Authorization header with Bearer token" -ForegroundColor Yellow
        Write-Host "- Check if frontend is properly authenticated" -ForegroundColor Yellow
    }
}

# Test other AI endpoints
Write-Host ""
Write-Host "Testing other AI endpoints..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/ai-health-bot/conversations" -Headers $headers
    Write-Host "SUCCESS: Get conversations endpoint working" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Get conversations failed" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/ai-health-bot/health"
    Write-Host "SUCCESS: AI Health check endpoint working" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AI Health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "FRONTEND DEBUGGING TIPS:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "1. Check if frontend is sending Authorization header" -ForegroundColor Yellow
Write-Host "2. Verify token format: 'Bearer <token>'" -ForegroundColor Yellow
Write-Host "3. Check if user is logged in before calling AI chat" -ForegroundColor Yellow
Write-Host "4. Verify backend URL in frontend matches: $backendUrl" -ForegroundColor Yellow
Write-Host "5. Check browser network tab for request headers" -ForegroundColor Yellow
