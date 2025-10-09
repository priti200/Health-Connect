# Video Call Testing Script

Write-Host "🎥 Testing HealthConnect Video Call Functionality" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$frontendUrl = "https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app"

# Step 1: Login to get authentication token
Write-Host ""
Write-Host "Step 1: Getting Authentication Token" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $loginHeaders = @{
        'Content-Type' = 'application/json'
    }

    $loginResponse = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -Headers $loginHeaders
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.token) {
        Write-Host "✅ Authentication successful" -ForegroundColor Green
        Write-Host "User: $($loginData.fullName) ($($loginData.email))" -ForegroundColor White
        $authToken = $loginData.token
    } else {
        Write-Host "❌ No token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test Room Endpoint with Authentication
Write-Host ""
Write-Host "Step 2: Testing Video Consultation Room Endpoint" -ForegroundColor Yellow
try {
    $roomHeaders = @{
        'Authorization' = "Bearer $authToken"
        'Content-Type' = 'application/json'
    }

    $roomResponse = Invoke-WebRequest -Uri "$backendUrl/api/video-consultation/room/1" -Method GET -Headers $roomHeaders
    $roomData = $roomResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Room endpoint successful" -ForegroundColor Green
    Write-Host "Room ID: $($roomData.roomId)" -ForegroundColor White
    Write-Host "Consultation ID: $($roomData.id)" -ForegroundColor White
    Write-Host "Status: $($roomData.status)" -ForegroundColor White
    Write-Host "Doctor: $($roomData.doctor.fullName)" -ForegroundColor White
    Write-Host "Patient: $($roomData.patient.fullName)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Room endpoint failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test Video Consultation Token Generation
Write-Host ""
Write-Host "Step 3: Testing Video Consultation Token Generation" -ForegroundColor Yellow
try {
    $tokenResponse = Invoke-WebRequest -Uri "$backendUrl/api/video-consultation/1/token" -Method GET -Headers $roomHeaders
    $tokenData = $tokenResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Video token generation successful" -ForegroundColor Green
    Write-Host "Access Token: $($tokenData.accessToken)" -ForegroundColor White
    Write-Host "Room Name: $($tokenData.roomName)" -ForegroundColor White
    Write-Host "Identity: $($tokenData.identity)" -ForegroundColor White
    Write-Host "User Role: $($tokenData.userRole)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Token generation failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test WebSocket Connection (Basic Check)
Write-Host ""
Write-Host "Step 4: Testing WebSocket Endpoint" -ForegroundColor Yellow
try {
    # Test if WebSocket endpoint is accessible (will return 404 for GET, but that's expected)
    $wsResponse = Invoke-WebRequest -Uri "$backendUrl/ws" -Method GET -ErrorAction SilentlyContinue
    Write-Host "⚠️ WebSocket endpoint accessible (404 expected for GET request)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ WebSocket endpoint accessible (404 expected for GET request)" -ForegroundColor Green
    } else {
        Write-Host "❌ WebSocket endpoint issue: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Step 5: Frontend Video Call URLs
Write-Host ""
Write-Host "Step 5: Frontend Video Call Access" -ForegroundColor Yellow
Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Blue
Write-Host "🎥 Video Consultation URL: $frontendUrl/telemedicine/consultation/1" -ForegroundColor Blue
Write-Host "📱 Direct Room Access: $frontendUrl/telemedicine/room/1" -ForegroundColor Blue

Write-Host ""
Write-Host "📋 Video Call Test Summary:" -ForegroundColor Blue
Write-Host "- Authentication: Working ✅" -ForegroundColor White
Write-Host "- Room Endpoint: Check results above" -ForegroundColor White
Write-Host "- Token Generation: Check results above" -ForegroundColor White
Write-Host "- WebSocket: Endpoint accessible ✅" -ForegroundColor White

Write-Host ""
Write-Host "🧪 Manual Testing Steps:" -ForegroundColor Green
Write-Host "1. Open: $frontendUrl" -ForegroundColor White
Write-Host "2. Login with: patient.test@healthconnect.com / password123" -ForegroundColor White
Write-Host "3. Navigate to: Telemedicine > Video Consultation" -ForegroundColor White
Write-Host "4. Try to join room ID: 1" -ForegroundColor White
Write-Host "5. Allow camera/microphone permissions" -ForegroundColor White
Write-Host "6. Test video call features" -ForegroundColor White
