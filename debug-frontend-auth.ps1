# Debug Frontend Authentication Issues

$frontendBackendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"

Write-Host "Debugging Frontend Authentication Issues" -ForegroundColor Cyan
Write-Host "Backend URL: $frontendBackendUrl" -ForegroundColor Yellow

# Step 1: Test Authentication
Write-Host ""
Write-Host "Step 1: Testing Authentication..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$frontendBackendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $response.token
    Write-Host "SUCCESS: Authentication working" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,30))..." -ForegroundColor Gray
    
    # Parse JWT to check expiration
    $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($token.Split('.')[1] + "=="))
    $jwtData = $payload | ConvertFrom-Json
    $expTime = [DateTimeOffset]::FromUnixTimeSeconds($jwtData.exp).DateTime
    Write-Host "Token expires: $expTime" -ForegroundColor Gray
    
} catch {
    Write-Host "ERROR: Authentication failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test AI Chat with proper headers (simulating frontend)
Write-Host ""
Write-Host "Step 2: Testing AI Chat with Frontend-like Request..." -ForegroundColor Yellow

$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    "Accept" = "application/json, text/plain, */*"
    "Origin" = "http://localhost:4200"
}

$chatRequest = @{
    message = "Hello, I have a headache. What should I do?"
    conversationId = $null
    conversationType = "GENERAL_HEALTH"
    isNewConversation = $true
} | ConvertTo-Json

try {
    Write-Host "Sending AI chat request..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$frontendBackendUrl/api/ai-health-bot/chat" -Method POST -Body $chatRequest -Headers $headers
    Write-Host "SUCCESS: AI Chat working perfectly!" -ForegroundColor Green
    Write-Host "AI Response: $($response.aiResponse.Substring(0,100))..." -ForegroundColor Green
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
    Write-Host "ERROR: AI Chat failed - Status: $statusCode" -ForegroundColor Red
    Write-Host "Error Details: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq "Forbidden") {
        Write-Host ""
        Write-Host "403 FORBIDDEN ANALYSIS:" -ForegroundColor Red
        Write-Host "- Token is valid but request is being rejected" -ForegroundColor Yellow
        Write-Host "- Check CORS configuration" -ForegroundColor Yellow
        Write-Host "- Check if frontend origin is allowed" -ForegroundColor Yellow
    }
}

# Step 3: Test without Authorization header (to confirm 403 vs 401)
Write-Host ""
Write-Host "Step 3: Testing without Authorization header..." -ForegroundColor Yellow

$headersNoAuth = @{ 
    "Content-Type" = "application/json"
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

try {
    $response = Invoke-RestMethod -Uri "$frontendBackendUrl/api/ai-health-bot/chat" -Method POST -Body $chatRequest -Headers $headersNoAuth
    Write-Host "UNEXPECTED: Request succeeded without auth" -ForegroundColor Red
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
    Write-Host "EXPECTED: Request failed without auth - Status: $statusCode" -ForegroundColor Yellow
}

# Step 4: Test with malformed token
Write-Host ""
Write-Host "Step 4: Testing with malformed token..." -ForegroundColor Yellow

$headersBadToken = @{ 
    "Authorization" = "Bearer invalid-token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$frontendBackendUrl/api/ai-health-bot/chat" -Method POST -Body $chatRequest -Headers $headersBadToken
    Write-Host "UNEXPECTED: Request succeeded with bad token" -ForegroundColor Red
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
    Write-Host "EXPECTED: Request failed with bad token - Status: $statusCode" -ForegroundColor Yellow
}

# Step 5: Test other authenticated endpoints
Write-Host ""
Write-Host "Step 5: Testing Other Authenticated Endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{ Name = "Get User Profile"; Url = "$frontendBackendUrl/api/users/me" },
    @{ Name = "Get Appointments"; Url = "$frontendBackendUrl/api/appointments" },
    @{ Name = "Get Chats"; Url = "$frontendBackendUrl/api/chats" },
    @{ Name = "Get AI Conversations"; Url = "$frontendBackendUrl/api/ai-health-bot/conversations" }
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Headers $headers
        Write-Host "SUCCESS: $($endpoint.Name)" -ForegroundColor Green
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        Write-Host "ERROR: $($endpoint.Name) - Status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "FRONTEND DEBUGGING CHECKLIST:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "1. Check browser console for authentication errors" -ForegroundColor Yellow
Write-Host "2. Verify user is logged in before using AI chat" -ForegroundColor Yellow
Write-Host "3. Check if token is stored in localStorage/sessionStorage" -ForegroundColor Yellow
Write-Host "4. Verify AuthInterceptor is adding Authorization header" -ForegroundColor Yellow
Write-Host "5. Check browser Network tab for request headers" -ForegroundColor Yellow
Write-Host "6. Verify frontend environment.apiUrl matches backend URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "BROWSER CONSOLE COMMANDS TO TEST:" -ForegroundColor Cyan
Write-Host "localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "sessionStorage.getItem('token')" -ForegroundColor Gray
Write-Host "localStorage.getItem('currentUser')" -ForegroundColor Gray
Write-Host ""
Write-Host "If token exists but requests fail, check:" -ForegroundColor Yellow
Write-Host "- CORS configuration in backend" -ForegroundColor Yellow
Write-Host "- Frontend environment configuration" -ForegroundColor Yellow
Write-Host "- AuthInterceptor is properly registered" -ForegroundColor Yellow
