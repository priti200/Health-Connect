@echo off
echo ========================================
echo   HEALTHCONNECT REAL-TIME VIDEO CALLING
echo ========================================
echo.
echo Starting backend with WebRTC support...
echo.

set JAVA_HOME=C:\Program Files\Java\jdk-23
set PATH=%JAVA_HOME%\bin;%PATH%

echo Compiling application...
mvn clean compile -q

if %ERRORLEVEL% NEQ 0 (
    echo Failed to compile. Trying direct Java execution...
    goto :direct_run
)

echo Starting with Maven...
mvn spring-boot:run -q

goto :end

:direct_run
echo.
echo Running directly with Java...
java -cp "target\classes;C:\Users\91706\.m2\repository\*" com.healthconnect.HealthConnectApplication

:end
echo.
echo Backend stopped.
pause
