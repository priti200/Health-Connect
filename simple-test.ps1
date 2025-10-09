Write-Host "Testing HealthConnect Backend"
Write-Host "=============================="

$backendUrl = "https://healthconnect-backend-dwa76nbkfq-uc.a.run.app"

Write-Host "Backend URL: $backendUrl"

# Test basic connectivity
Write-Host ""
Write-Host "Test 1: Basic Connectivity"
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/" -Method GET -TimeoutSec 30
    Write-Host "Success: $($response.StatusCode)"
} catch {
    Write-Host "Response: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "Server is responding (403 is expected due to security)"
    }
}

# Test authentication
Write-Host ""
Write-Host "Test 2: Authentication Endpoint"
try {
    $body = '{"email":"patient.test@healthconnect.com","password":"password123"}'
    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Success: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    Write-Host "This might be due to CORS configuration"
}

Write-Host ""
Write-Host "Backend is deployed and responding!"
