# PowerShell script to start the backend
Write-Host "========================================" -ForegroundColor Green
Write-Host "HealthConnect Backend PowerShell Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Change to backend directory
Set-Location "C:\Users\91706\Desktop\new\Meditech\backend"

# Set JAVA_HOME environment variable for this session
$env:JAVA_HOME = "C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing Java..." -ForegroundColor Cyan
& "$env:JAVA_HOME\bin\java.exe" -version
Write-Host ""

Write-Host "Testing javac..." -ForegroundColor Cyan
& "$env:JAVA_HOME\bin\javac.exe" -version
Write-Host ""

Write-Host "Starting Maven wrapper..." -ForegroundColor Green
Write-Host ""

# Run Maven wrapper
& ".\mvnw.cmd" spring-boot:run

Write-Host ""
Write-Host "Backend stopped." -ForegroundColor Red
Read-Host "Press Enter to continue"
