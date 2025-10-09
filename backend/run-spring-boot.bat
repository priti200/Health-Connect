@echo off
echo ========================================
echo HealthConnect Backend - Direct Spring Boot Run
echo ========================================

cd /d "C:\Users\91706\Desktop\new\Meditech\backend"

set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo Testing Java...
"%JAVA_EXE%" -version
echo.

echo Checking if classes are compiled...
if not exist "target\classes\com\healthconnect\HealthConnectApplication.class" (
    echo Classes not found. Compiling...
    "%JAVA_HOME%\bin\javac.exe" -cp "src\main\java" -d "target\classes" src\main\java\com\healthconnect\*.java src\main\java\com\healthconnect\*\*.java
)

echo.
echo Starting Spring Boot application directly...

REM Try to run with Spring Boot's embedded server
"%JAVA_EXE%" -Dspring.profiles.active=dev -Dserver.port=8080 -cp "target\classes" com.healthconnect.HealthConnectApplication

pause
