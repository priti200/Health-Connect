# HealthConnect Backend Startup Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "HealthConnect Backend Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Set Java environment
$env:JAVA_HOME = "C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Setting up Java environment..." -ForegroundColor Yellow
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan

# Test Java installation
Write-Host "`nTesting Java installation..." -ForegroundColor Yellow
try {
    $javaVersion = & java -version 2>&1
    Write-Host "Java Version:" -ForegroundColor Cyan
    Write-Host $javaVersion -ForegroundColor White
} catch {
    Write-Host "Error: Java not found!" -ForegroundColor Red
    exit 1
}

# Test Maven installation
Write-Host "`nTesting Maven installation..." -ForegroundColor Yellow
$mavenPath = ".\maven-temp\apache-maven-3.6.3\bin\mvn.cmd"

if (Test-Path $mavenPath) {
    Write-Host "Maven found at: $mavenPath" -ForegroundColor Cyan
    try {
        $mavenVersion = & $mavenPath --version 2>&1
        Write-Host "Maven Version:" -ForegroundColor Cyan
        Write-Host $mavenVersion -ForegroundColor White
    } catch {
        Write-Host "Error: Maven execution failed!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Error: Maven not found at $mavenPath" -ForegroundColor Red
    exit 1
}

# Check if pom.xml exists
Write-Host "`nChecking project structure..." -ForegroundColor Yellow
if (Test-Path "pom.xml") {
    Write-Host "✓ pom.xml found" -ForegroundColor Green
} else {
    Write-Host "✗ pom.xml not found!" -ForegroundColor Red
    exit 1
}

if (Test-Path "src\main\java") {
    Write-Host "✓ Source directory found" -ForegroundColor Green
} else {
    Write-Host "✗ Source directory not found!" -ForegroundColor Red
    exit 1
}

# Try to compile the project
Write-Host "`nCompiling the project..." -ForegroundColor Yellow
try {
    Write-Host "Running: mvn clean compile" -ForegroundColor Cyan
    $compileResult = & $mavenPath clean compile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Compilation successful!" -ForegroundColor Green
        
        # Try to run the application
        Write-Host "`nStarting Spring Boot application..." -ForegroundColor Yellow
        Write-Host "Running: mvn spring-boot:run" -ForegroundColor Cyan
        Write-Host "This may take a few minutes..." -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Green
        
        & $mavenPath spring-boot:run
        
    } else {
        Write-Host "✗ Compilation failed!" -ForegroundColor Red
        Write-Host "Compilation output:" -ForegroundColor Yellow
        Write-Host $compileResult -ForegroundColor White
    }
} catch {
    Write-Host "Error during compilation:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

        } else {
            Write-Host "✗ Compilation failed!" -ForegroundColor Red
            Write-Host "Compilation output:" -ForegroundColor Yellow
            Write-Host $compileResult -ForegroundColor White
        }
    } catch {
        Write-Host "Error during compilation:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

Write-Host "`nScript completed." -ForegroundColor Yellow
