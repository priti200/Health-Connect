# Simple AI Prescription Analyzer Test

Write-Host "Testing AI Prescription Analyzer" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

$imagePath = "C:\Users\DELL\OneDrive\Desktop\pres.png"
$geminiApiUrl = "https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant"

# Check if image file exists
Write-Host "1. Checking image file..." -ForegroundColor Yellow
if (Test-Path $imagePath) {
    Write-Host "   Image file found: $imagePath" -ForegroundColor Green
    $fileInfo = Get-Item $imagePath
    Write-Host "   File size: $([math]::Round($fileInfo.Length / 1KB, 2)) KB" -ForegroundColor White
} else {
    Write-Host "   Image file not found: $imagePath" -ForegroundColor Red
    exit 1
}

# Convert image to base64
Write-Host "2. Converting image to base64..." -ForegroundColor Yellow
try {
    $imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
    $base64String = [System.Convert]::ToBase64String($imageBytes)
    Write-Host "   Image converted successfully (length: $($base64String.Length) characters)" -ForegroundColor Green
} catch {
    Write-Host "   Failed to convert image: $($_.Exception.Message)" -ForegroundColor Red
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

    Write-Host "   Calling API (this may take 30-60 seconds)..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri $geminiApiUrl -Method POST -Body $requestBody -Headers $headers -TimeoutSec 120

    Write-Host "   API call successful!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Analysis Result:" -ForegroundColor Blue
    Write-Host "===============" -ForegroundColor Blue
    Write-Host $response.Content -ForegroundColor White

} catch {
    Write-Host "   API call failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Blue
