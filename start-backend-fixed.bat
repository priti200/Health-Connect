@echo off
echo ========================================
echo  HealthConnect Backend Startup (FIXED)
echo ========================================

echo.
echo [1/5] Checking Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java not found or not properly configured
    echo Please install Java 17 or later and set JAVA_HOME
    pause
    exit /b 1
)

echo.
echo [2/5] Setting up environment...
cd /d "%~dp0backend"
if not exist "pom.xml" (
    echo ERROR: pom.xml not found in backend directory
    pause
    exit /b 1
)

echo.
echo [3/5] Cleaning previous build...
call mvnw.cmd clean -q

echo.
echo [4/5] Compiling application...
call mvnw.cmd compile -q
if %ERRORLEVEL% neq 0 (
    echo ERROR: Compilation failed
    pause
    exit /b 1
)

echo.
echo [5/5] Starting HealthConnect Backend...
echo.
echo Backend will start on: http://localhost:8080
echo Health Check: http://localhost:8080/api/health
echo WebSocket Test: http://localhost:8080/api/health/websocket
echo H2 Console: http://localhost:8080/h2-console
echo.
echo Press Ctrl+C to stop the server
echo.

call mvnw.cmd spring-boot:run
