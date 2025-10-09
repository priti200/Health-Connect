@echo off
echo ========================================
echo HealthConnect Backend Debug Run
echo ========================================

cd /d "C:\Users\91706\Desktop\new\Meditech\backend"

echo Current directory: %CD%
echo.

echo Java version:
java -version
echo.

echo JAVA_HOME: %JAVA_HOME%
echo.

echo Testing Maven wrapper...
mvnw.cmd --version
echo.

echo Attempting to clean and compile...
mvnw.cmd clean compile
echo Maven clean compile exit code: %ERRORLEVEL%
echo.

if %ERRORLEVEL% EQU 0 (
    echo Compilation successful! Starting Spring Boot...
    mvnw.cmd spring-boot:run
) else (
    echo Compilation failed. Check the error messages above.
)

pause
