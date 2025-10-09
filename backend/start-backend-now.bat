@echo off
echo Starting HealthConnect Backend...

REM Set JAVA_HOME to the VS Code extension JDK
set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo Java Version:
java -version

echo.
echo Starting Maven build and run...
echo.

REM Change to backend directory
cd /d "%~dp0"

REM Try to run with Maven wrapper
call mvnw.cmd spring-boot:run

pause
