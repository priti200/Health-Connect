@echo off
echo ========================================
echo  Meditech Real-time Features Startup
echo ========================================
echo.

echo [1/5] Checking Java environment...
java -version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java not found. Please install Java 17 or higher.
    pause
    exit /b 1
)

echo.
echo [2/5] Checking Node.js environment...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo.
echo [3/5] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies.
    pause
    exit /b 1
)

echo.
echo [4/5] Building frontend...
call npm run build --prod=false
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed.
    pause
    exit /b 1
)

echo.
echo [5/5] Starting backend...
cd ..\backend
start "Backend Server" cmd /k "mvnw spring-boot:run"

echo.
echo [6/6] Starting frontend development server...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ========================================
echo  Startup Complete!
echo ========================================
echo.
echo Backend: http://localhost:8080
echo Frontend: http://localhost:4200
echo H2 Console: http://localhost:8080/h2-console
echo.
echo Real-time Features Test: file:///test-realtime-features.html
echo.
echo Press any key to open test page...
pause > nul

start "" "test-realtime-features.html"

echo.
echo Servers are running in separate windows.
echo Close this window when done testing.
pause
