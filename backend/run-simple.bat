@echo off
echo ========================================
echo HealthConnect Backend Startup
echo ========================================

REM Set Java environment
set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java Version:
java -version
echo.

echo Attempting to run Spring Boot application...
echo.

REM Try different approaches to run the application

echo Approach 1: Using Maven wrapper with explicit JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-23
mvnw.cmd spring-boot:run
if %ERRORLEVEL% EQU 0 goto success

echo.
echo Approach 2: Using downloaded Maven
maven-temp\apache-maven-3.6.3\bin\mvn.cmd spring-boot:run
if %ERRORLEVEL% EQU 0 goto success

echo.
echo Approach 3: Trying to compile and run manually
javac -version
if %ERRORLEVEL% NEQ 0 goto error

echo All approaches failed. Please check the error messages above.
goto end

:success
echo.
echo ========================================
echo Backend started successfully!
echo ========================================
goto end

:error
echo.
echo ========================================
echo Error: Could not start the backend
echo ========================================

:end
pause
