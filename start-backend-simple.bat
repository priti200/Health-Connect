@echo off
cd backend
set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Starting HealthConnect Backend...
echo Java Version:
java -version

echo.
echo Attempting to start with Maven wrapper...
call mvnw.cmd spring-boot:run

pause
