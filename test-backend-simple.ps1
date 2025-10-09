# Simple HealthConnect Backend Testing

Write-Host "Testing HealthConnect Backend" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"

# Test 1: Health Check
Write-Host ""
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/health" -Method GET
    Write-Host "   SUCCESS: Health Check - $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: Health Check - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 2: Get All Doctors
Write-Host ""
Write-Host "2. Testing Get All Doctors..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/doctors" -Method GET
    Write-Host "   SUCCESS: Get Doctors - $($response.StatusCode)" -ForegroundColor Green
    $doctors = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($doctors.Count) doctors" -ForegroundColor White
} catch {
    Write-Host "   FAILED: Get Doctors - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 3: Debug Doctors Endpoint
Write-Host ""
Write-Host "3. Testing Debug Doctors Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/doctors/debug/all" -Method GET
    Write-Host "   SUCCESS: Debug Doctors - $($response.StatusCode)" -ForegroundColor Green
    $debugDoctors = $response.Content | ConvertFrom-Json
    Write-Host "   Available Doctors:" -ForegroundColor Cyan
    foreach ($doctor in $debugDoctors) {
        Write-Host "     ID: $($doctor.id), Name: $($doctor.name)" -ForegroundColor White
    }
} catch {
    Write-Host "   FAILED: Debug Doctors - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 4: Authentication
Write-Host ""
Write-Host "4. Testing Authentication..." -ForegroundColor Yellow
$loginBody = '{"email":"patient.test@healthconnect.com","password":"password123"}'
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $loginBody -ContentType 'application/json'
    Write-Host "   SUCCESS: Login - $($response.StatusCode)" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    $authToken = $loginData.token
    Write-Host "   Auth token obtained" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: Login - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $authToken = $null
}

# Test 5: Authenticated Endpoints
if ($authToken) {
    Write-Host ""
    Write-Host "5. Testing Authenticated Endpoints..." -ForegroundColor Yellow
    $authHeaders = @{'Authorization' = "Bearer $authToken"}
    
    # Test Get Current User
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/users/me" -Method GET -Headers $authHeaders
        Write-Host "   SUCCESS: Get Current User - $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   FAILED: Get Current User - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    
    # Test Get Appointments
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/appointments" -Method GET -Headers $authHeaders
        Write-Host "   SUCCESS: Get Appointments - $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   FAILED: Get Appointments - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    
    # Test Get Chats
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/chats" -Method GET -Headers $authHeaders
        Write-Host "   SUCCESS: Get Chats - $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   FAILED: Get Chats - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 6: Doctor Time Slots (Previously Problematic)
Write-Host ""
Write-Host "6. Testing Doctor Time Slots..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/doctors/1/time-slots?date=2025-06-21" -Method GET
    Write-Host "   SUCCESS: Doctor 1 Time Slots - $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "   FAILED: Doctor 1 Time Slots - $statusCode" -ForegroundColor Red
    if ($statusCode -eq 400) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Error Details: $errorBody" -ForegroundColor Gray
        } catch {
            Write-Host "   Could not read error details" -ForegroundColor Gray
        }
    }
}

# Test 7: Gemini Proxy Health
Write-Host ""
Write-Host "7. Testing Gemini Proxy..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/gemini/health" -Method GET
    Write-Host "   SUCCESS: Gemini Health - $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: Gemini Health - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 8: Insurance Health
Write-Host ""
Write-Host "8. Testing Insurance..." -ForegroundColor Yellow
if ($authToken) {
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/insurance/health" -Method GET -Headers $authHeaders
        Write-Host "   SUCCESS: Insurance Health - $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   FAILED: Insurance Health - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
} else {
    Write-Host "   SKIPPED: No auth token available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend Testing Completed!" -ForegroundColor Blue
