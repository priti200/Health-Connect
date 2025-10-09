#!/usr/bin/env pwsh

Write-Host "🏥 HealthConnect - Starting Full Stack Application" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if ports are available
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow

if (Test-Port 8080) {
    Write-Host "⚠️  Port 8080 is already in use. Backend might already be running." -ForegroundColor Yellow
} else {
    Write-Host "✅ Port 8080 is available" -ForegroundColor Green
}

if (Test-Port 4200) {
    Write-Host "⚠️  Port 4200 is already in use. Frontend might already be running." -ForegroundColor Yellow
} else {
    Write-Host "✅ Port 4200 is available" -ForegroundColor Green
}

Write-Host ""

# Start Backend
Write-Host "🚀 Starting Backend (Spring Boot)..." -ForegroundColor Cyan
Write-Host "Opening new terminal for backend..." -ForegroundColor Yellow

$backendScript = @"
Set-Location '$PWD\backend'
`$env:JAVA_HOME = 'C:\Program Files\Java\jdk-23'
`$env:PATH = "`$env:JAVA_HOME\bin;`$env:PATH"

Write-Host 'Starting backend compilation and run...' -ForegroundColor Green

# Try different Maven approaches
if (Test-Path 'mvnw.cmd') {
    Write-Host 'Using Maven wrapper...' -ForegroundColor Cyan
    .\mvnw.cmd spring-boot:run
} elseif (Test-Path 'maven-temp\apache-maven-3.6.3\bin\mvn.cmd') {
    Write-Host 'Using local Maven...' -ForegroundColor Cyan
    .\maven-temp\apache-maven-3.6.3\bin\mvn.cmd spring-boot:run
} else {
    Write-Host 'No Maven found!' -ForegroundColor Red
    Read-Host 'Press Enter to close'
}
"@

# Start backend in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

Write-Host "⏳ Waiting 10 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Frontend
Write-Host "🚀 Starting Frontend (Angular)..." -ForegroundColor Cyan
Write-Host "Opening new terminal for frontend..." -ForegroundColor Yellow

$frontendScript = @"
Set-Location '$PWD\frontend'

Write-Host 'Starting frontend...' -ForegroundColor Green

# Try different approaches to start Angular
if (Test-Path 'node_modules\.bin\ng.cmd') {
    Write-Host 'Using local Angular CLI...' -ForegroundColor Cyan
    .\node_modules\.bin\ng.cmd serve --port 4200 --host 0.0.0.0
} else {
    Write-Host 'Using npm start...' -ForegroundColor Cyan
    npm start
}
"@

# Start frontend in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host ""
Write-Host "🎉 HealthConnect startup initiated!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:4200" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "🗄️  Database: http://localhost:8080/h2-console" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Doctor:  doctor.test@healthconnect.com / password123" -ForegroundColor White
Write-Host "   Patient: patient.test@healthconnect.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Please wait a few minutes for both services to fully start..." -ForegroundColor Yellow
Write-Host "💡 Check the new terminal windows for startup progress" -ForegroundColor Cyan

Read-Host "Press Enter to exit this script (services will continue running)"
