@echo off
echo Trying alternative startup methods...

REM Method 1: Try with system Java
echo [1] Trying with system Java...
java -version
if %ERRORLEVEL% EQU 0 (
    echo Java found, trying to run Spring Boot...
    java -jar target/*.jar
    if %ERRORLEVEL% EQU 0 goto success
)

REM Method 2: Try Maven with system Java
echo [2] Trying Maven with system Java...
mvn -version
if %ERRORLEVEL% EQU 0 (
    echo Maven found, trying to run...
    mvn spring-boot:run
    if %ERRORLEVEL% EQU 0 goto success
)

REM Method 3: Try to find and set JAVA_HOME
echo [3] Searching for Java installations...
for /d %%i in ("C:\Program Files\Java\*") do (
    if exist "%%i\bin\java.exe" (
        echo Found Java at: %%i
        set JAVA_HOME=%%i
        set PATH=%%i\bin;%PATH%
        echo Trying with JAVA_HOME=%%i
        call mvnw.cmd spring-boot:run
        if %ERRORLEVEL% EQU 0 goto success
    )
)

echo [4] All methods failed. Please:
echo 1. Install Java JDK 17 or higher
echo 2. Set JAVA_HOME environment variable
echo 3. Or run: npm start (frontend only)
pause
exit /b 1

:success
echo Backend started successfully!
pause
