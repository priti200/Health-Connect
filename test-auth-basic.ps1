# Basic Authentication Test for HealthConnect Backend

$baseUrl = "http://localhost:8081"

Write-Host "Testing Authentication Flow" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Test 1: Login with patient credentials
Write-Host "1. Testing Patient Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "patient.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS: Patient login successful" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0,20))..." -ForegroundColor Gray
    $patientToken = $response.token
} catch {
    Write-Host "ERROR: Patient login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login with doctor credentials
Write-Host "2. Testing Doctor Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "doctor.test@healthconnect.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS: Doctor login successful" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0,20))..." -ForegroundColor Gray
    $doctorToken = $response.token
} catch {
    Write-Host "ERROR: Doctor login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Test authenticated endpoint with patient token
Write-Host "3. Testing Authenticated Endpoint (Patient)..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $patientToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method GET -Headers $headers
    Write-Host "SUCCESS: Patient profile retrieved" -ForegroundColor Green
    Write-Host "User: $($response.fullName) ($($response.email))" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to get patient profile: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test authenticated endpoint with doctor token
Write-Host "4. Testing Authenticated Endpoint (Doctor)..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $doctorToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method GET -Headers $headers
    Write-Host "SUCCESS: Doctor profile retrieved" -ForegroundColor Green
    Write-Host "User: $($response.fullName) ($($response.email))" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to get doctor profile: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test public endpoints
Write-Host "5. Testing Public Endpoints..." -ForegroundColor Yellow

$publicEndpoints = @(
    @{ Name = "Health Check"; Url = "$baseUrl/api/health" },
    @{ Name = "Test Health"; Url = "$baseUrl/api/test/health" },
    @{ Name = "Get All Doctors"; Url = "$baseUrl/api/doctors" },
    @{ Name = "Gemini Health"; Url = "$baseUrl/api/gemini/health" }
)

foreach ($endpoint in $publicEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET
        Write-Host "SUCCESS: $($endpoint.Name)" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $($endpoint.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Test protected endpoints
Write-Host "6. Testing Protected Endpoints..." -ForegroundColor Yellow

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
        Write-Host "SUCCESS: $($endpoint.Name) - returned $($response.Count) items" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $($endpoint.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Authentication testing completed!" -ForegroundColor Cyan
