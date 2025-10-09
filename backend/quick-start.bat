@echo off
echo ========================================
echo HealthConnect Quick Start
echo ========================================

REM Set Java environment with proper escaping
set JAVA_HOME=C:\Program Files\Java\jdk-23
set PATH=%JAVA_HOME%\bin;%PATH%

echo JAVA_HOME: %JAVA_HOME%
echo.

echo Testing Java installation...
java -version
if %ERRORLEVEL% NEQ 0 (
    echo Error: Java not found!
    pause
    exit /b 1
)

echo.
echo Attempting to compile and run with Maven wrapper...
echo.

REM Try Maven wrapper first
if exist mvnw.cmd (
    echo Using Maven wrapper...
    mvnw.cmd clean compile spring-boot:run
    if %ERRORLEVEL% EQU 0 goto success
)

echo.
echo Trying with local Maven installation...
if exist maven-temp\apache-maven-3.6.3\bin\mvn.cmd (
    echo Using local Maven...
    maven-temp\apache-maven-3.6.3\bin\mvn.cmd clean compile spring-boot:run
    if %ERRORLEVEL% EQU 0 goto success
)

echo.
echo All Maven attempts failed. Trying direct Java compilation...
echo.

REM Create lib directory for dependencies
if not exist lib mkdir lib

REM Try to find Spring Boot JAR in Maven repository
set "SPRING_BOOT_JAR=%USERPROFILE%\.m2\repository\org\springframework\boot\spring-boot\3.4.5\spring-boot-3.4.5.jar"

if exist "%SPRING_BOOT_JAR%" (
    echo Found Spring Boot JAR, attempting direct compilation...
    javac -cp "%SPRING_BOOT_JAR%;." -d target\classes src\main\java\com\healthconnect\*.java
    if %ERRORLEVEL% EQU 0 (
        echo Compilation successful, running application...
        java -cp "target\classes;%SPRING_BOOT_JAR%" com.healthconnect.HealthConnectApplication
        goto success
    )
)

echo.
echo ========================================
echo All startup methods failed!
echo ========================================
echo Please check:
echo 1. Java installation
echo 2. Maven installation
echo 3. Internet connection for dependencies
echo 4. Project structure
echo.
pause
exit /b 1

:success
echo.
echo ========================================
echo Backend started successfully!
echo ========================================
echo Backend URL: http://localhost:8080
echo Health Check: http://localhost:8080/api/test/health
echo H2 Console: http://localhost:8080/h2-console
echo.
pause
