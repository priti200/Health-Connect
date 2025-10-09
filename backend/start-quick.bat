@echo off
echo Starting HealthConnect Backend...

REM Set Java environment
set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java Version:
java -version
echo.

echo Compiling and running Spring Boot application...
echo.

REM Compile the application
echo Compiling...
javac -cp "target\classes" -d target\classes src\main\java\com\healthconnect\*.java src\main\java\com\healthconnect\*\*.java

REM Try to run with Spring Boot
echo Starting application...
java -cp "target\classes" -Dspring.profiles.active=default com.healthconnect.HealthConnectApplication

pause
