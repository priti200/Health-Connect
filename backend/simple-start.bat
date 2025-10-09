@echo off
echo ========================================
echo HealthConnect Backend Startup
echo ========================================

REM Set Java environment
set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo.

echo Testing Java...
java -version
if %ERRORLEVEL% NEQ 0 (
    echo Error: Java not working!
    pause
    exit /b 1
)

echo.
echo Testing Maven...
maven-temp\apache-maven-3.6.3\bin\mvn.cmd --version
if %ERRORLEVEL% NEQ 0 (
    echo Error: Maven not working!
    pause
    exit /b 1
)

echo.
echo Starting compilation...
maven-temp\apache-maven-3.6.3\bin\mvn.cmd clean compile
if %ERRORLEVEL% NEQ 0 (
    echo Error: Compilation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting Spring Boot Application...
echo ========================================
echo This may take a few minutes...
echo.

maven-temp\apache-maven-3.6.3\bin\mvn.cmd spring-boot:run

pause
