@echo off
echo Starting HealthConnect Backend...

REM Set JAVA_HOME to the correct JDK path
set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo Java Version:
java -version

echo.
echo Starting Maven build and run...
echo.

REM Try to run with Maven wrapper
mvnw.cmd spring-boot:run

pause
