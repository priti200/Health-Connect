# Simple Authentication Test for HealthConnect Backend

$baseUrl = "http://localhost:8081"

Write-Host "🔐 Testing Authentication Flow" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Test 1: Login with patient credentials
Write-Host "`n1. Testing Patient Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Patient login successful" -ForegroundColor Green
    Write-Host "   Token: $($response.token.Substring(0,20))..." -ForegroundColor Gray
    $patientToken = $response.token
} catch {
    Write-Host "❌ Patient login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login with doctor credentials
Write-Host "`n2. Testing Doctor Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "doctor.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Doctor login successful" -ForegroundColor Green
    Write-Host "   Token: $($response.token.Substring(0,20))..." -ForegroundColor Gray
    $doctorToken = $response.token
} catch {
    Write-Host "❌ Doctor login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Test authenticated endpoint with patient token
Write-Host "`n3. Testing Authenticated Endpoint (Patient)..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $patientToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method GET -Headers $headers
    Write-Host "✅ Patient profile retrieved successfully" -ForegroundColor Green
    Write-Host "   User: $($response.fullName) ($($response.email))" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get patient profile: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test authenticated endpoint with doctor token
Write-Host "`n4. Testing Authenticated Endpoint (Doctor)..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $doctorToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method GET -Headers $headers
    Write-Host "✅ Doctor profile retrieved successfully" -ForegroundColor Green
    Write-Host "   User: $($response.fullName) ($($response.email))" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get doctor profile: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test public endpoints
Write-Host "`n5. Testing Public Endpoints..." -ForegroundColor Yellow

$publicEndpoints = @(
    @{ Name = "Health Check"; Url = "$baseUrl/api/health" },
    @{ Name = "Test Health"; Url = "$baseUrl/api/test/health" },
    @{ Name = "Get All Doctors"; Url = "$baseUrl/api/doctors" },
    @{ Name = "Gemini Health"; Url = "$baseUrl/api/gemini/health" }
)

foreach ($endpoint in $publicEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
        Write-Host "✅ $($endpoint.Name) - Success" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Test protected endpoints that should require auth
Write-Host "`n6. Testing Protected Endpoints..." -ForegroundColor Yellow

$protectedEndpoints = @(
    @{ Name = "Patient Appointments"; Url = "$baseUrl/api/appointments"; Token = $patientToken },
    @{ Name = "Doctor Appointments"; Url = "$baseUrl/api/appointments"; Token = $doctorToken },
    @{ Name = "Patient Chats"; Url = "$baseUrl/api/chats"; Token = $patientToken },
    @{ Name = "Doctor Chats"; Url = "$baseUrl/api/chats"; Token = $doctorToken }
)

foreach ($endpoint in $protectedEndpoints) {
    try {
        $headers = @{ "Authorization" = "Bearer $($endpoint.Token)" }
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET -Headers $headers
        Write-Host "✅ $($endpoint.Name) - Success (returned $($response.Count) items)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAuthentication testing completed!" -ForegroundColor Cyan
