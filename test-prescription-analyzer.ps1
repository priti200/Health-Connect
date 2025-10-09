# Test AI Prescription Analyzer with Real Image

Write-Host "🤖 Testing AI Prescription Analyzer" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

$imagePath = "C:\Users\DELL\OneDrive\Desktop\pres.png"
$geminiApiUrl = "https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant"

# Check if image file exists
Write-Host "1. Checking image file..." -ForegroundColor Yellow
if (Test-Path $imagePath) {
    Write-Host "   ✅ Image file found: $imagePath" -ForegroundColor Green
    $fileInfo = Get-Item $imagePath
    Write-Host "   File size: $([math]::Round($fileInfo.Length / 1KB, 2)) KB" -ForegroundColor White
} else {
    Write-Host "   ❌ Image file not found: $imagePath" -ForegroundColor Red
    exit 1
}

# Convert image to base64
Write-Host "2. Converting image to base64..." -ForegroundColor Yellow
try {
    $imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
    $base64String = [System.Convert]::ToBase64String($imageBytes)
    Write-Host "   ✅ Image converted to base64 (length: $($base64String.Length) characters)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to convert image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Gemini API
Write-Host "3. Testing Gemini Medical Assistant API..." -ForegroundColor Yellow
try {
    $requestBody = @{
        image_base64 = $base64String
    } | ConvertTo-Json

    $headers = @{
        'Content-Type' = 'application/json'
    }

    Write-Host "   Calling API..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri $geminiApiUrl -Method POST -Body $requestBody -Headers $headers -TimeoutSec 120

    Write-Host "   ✅ API call successful!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "   Response length: $($response.Content.Length) characters" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📋 Analysis Result:" -ForegroundColor Blue
    Write-Host "==================" -ForegroundColor Blue
    Write-Host $response.Content -ForegroundColor White

} catch {
    Write-Host "   ❌ API call failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Error Body: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "   Could not read error response body" -ForegroundColor Red
        }
    }
}

# Test Frontend Accessibility
Write-Host ""
Write-Host "4. Testing Frontend Prescription Analyzer..." -ForegroundColor Yellow
try {
    $frontendUrl = "https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app"
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 30
    Write-Host "   ✅ Frontend accessible: $($response.StatusCode)" -ForegroundColor Green
    
    # Check if prescription analyzer route exists
    $analyzerUrl = "$frontendUrl/prescription-analyzer"
    try {
        $analyzerResponse = Invoke-WebRequest -Uri $analyzerUrl -Method GET -TimeoutSec 30
        Write-Host "   ✅ Prescription analyzer page accessible: $($analyzerResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Prescription analyzer page: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ Frontend not accessible: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Test Summary:" -ForegroundColor Blue
Write-Host "===============" -ForegroundColor Blue
Write-Host "✅ Image file: Found and converted" -ForegroundColor Green
Write-Host "🤖 Gemini API: Check results above" -ForegroundColor White
Write-Host "🌐 Frontend: Check results above" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Blue
Write-Host "1. If API works, check frontend console for errors" -ForegroundColor White
Write-Host "2. Test the prescription analyzer in the browser" -ForegroundColor White
Write-Host "3. Check network tab for failed requests" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Test URLs:" -ForegroundColor Blue
Write-Host "Frontend: https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app" -ForegroundColor White
Write-Host "Prescription Analyzer: https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app/prescription-analyzer" -ForegroundColor White
