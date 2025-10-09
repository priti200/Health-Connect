@echo off
echo Starting HealthConnect Backend...

REM Set environment variables
set JAVA_HOME=C:\Program Files\Java\jdk-23
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version:
java -version

echo.
echo Starting with Maven wrapper...
mvnw.cmd spring-boot:run

pause
