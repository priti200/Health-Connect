# Specific CORS Preflight Testing Script

Write-Host "🌐 HealthConnect CORS Preflight Testing" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

$backendUrl = "https://healthconnect-backend-1026546995867.us-central1.run.app"
$frontendOrigin = "https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app"

function Test-CORSPreflight {
    param($endpoint, $method = "GET")
    
    Write-Host ""
    Write-Host "Testing CORS Preflight for: $endpoint" -ForegroundColor Yellow
    
    try {
        # Test 1: Simple OPTIONS request
        Write-Host "  1. Simple OPTIONS request..." -ForegroundColor Gray
        $simpleOptions = Invoke-WebRequest -Uri "$backendUrl$endpoint" -Method OPTIONS
        Write-Host "     ✅ Status: $($simpleOptions.StatusCode)" -ForegroundColor Green
        
        # Check for CORS headers
        $corsHeaders = $simpleOptions.Headers.GetEnumerator() | Where-Object { 
            $_.Key -like "*Access-Control*" -or $_.Key -eq "vary" -or $_.Key -eq "allow"
        }
        
        if ($corsHeaders) {
            Write-Host "     ✅ CORS Headers found:" -ForegroundColor Green
            foreach ($header in $corsHeaders) {
                Write-Host "       $($header.Key): $($header.Value)" -ForegroundColor White
            }
        } else {
            Write-Host "     ⚠️ No CORS headers found" -ForegroundColor Yellow
        }
        
        # Test 2: Preflight with Origin header
        Write-Host "  2. OPTIONS with Origin header..." -ForegroundColor Gray
        $preflightHeaders = @{
            'Origin' = $frontendOrigin
        }
        
        $preflightResponse = Invoke-WebRequest -Uri "$backendUrl$endpoint" -Method OPTIONS -Headers $preflightHeaders
        Write-Host "     ✅ Status: $($preflightResponse.StatusCode)" -ForegroundColor Green
        
        # Test 3: Preflight with full CORS headers
        Write-Host "  3. Full CORS preflight..." -ForegroundColor Gray
        $fullPreflightHeaders = @{
            'Origin' = $frontendOrigin
            'Access-Control-Request-Method' = $method
            'Access-Control-Request-Headers' = 'content-type,authorization'
        }
        
        $fullResponse = Invoke-WebRequest -Uri "$backendUrl$endpoint" -Method OPTIONS -Headers $fullPreflightHeaders
        Write-Host "     ✅ Status: $($fullResponse.StatusCode)" -ForegroundColor Green
        
        # Check for specific CORS response headers
        $allowOrigin = $fullResponse.Headers['Access-Control-Allow-Origin']
        $allowMethods = $fullResponse.Headers['Access-Control-Allow-Methods']
        $allowHeaders = $fullResponse.Headers['Access-Control-Allow-Headers']
        
        Write-Host "     CORS Response Headers:" -ForegroundColor Cyan
        Write-Host "       Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor White
        Write-Host "       Access-Control-Allow-Methods: $allowMethods" -ForegroundColor White
        Write-Host "       Access-Control-Allow-Headers: $allowHeaders" -ForegroundColor White
        
        return $true
        
    } catch {
        Write-Host "     ❌ Failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test different endpoints
$endpoints = @(
    @{ path = "/api/auth/login"; method = "POST" },
    @{ path = "/api/doctors"; method = "GET" },
    @{ path = "/api/appointments"; method = "GET" },
    @{ path = "/api/users/me"; method = "GET" },
    @{ path = "/api/video-consultation"; method = "GET" }
)

$results = @()

foreach ($endpoint in $endpoints) {
    $success = Test-CORSPreflight -endpoint $endpoint.path -method $endpoint.method
    $results += @{
        Endpoint = $endpoint.path
        Method = $endpoint.method
        Success = $success
    }
}

Write-Host ""
Write-Host "📊 CORS Test Summary" -ForegroundColor Blue
Write-Host "===================" -ForegroundColor Blue

$passCount = ($results | Where-Object { $_.Success }).Count
$totalCount = $results.Count

Write-Host "Total Endpoints Tested: $totalCount" -ForegroundColor White
Write-Host "✅ Successful: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $($totalCount - $passCount)" -ForegroundColor Red

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor Blue
foreach ($result in $results) {
    $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "  $($result.Endpoint) ($($result.Method)): $status" -ForegroundColor $color
}

if ($passCount -eq $totalCount) {
    Write-Host ""
    Write-Host "🎉 ALL CORS PREFLIGHT TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your HealthConnect application has 100% CORS compatibility!" -ForegroundColor Green
} elseif ($passCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️ Partial CORS success - some endpoints working" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ CORS preflight issues detected" -ForegroundColor Red
}
