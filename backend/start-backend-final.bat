@echo off
echo ========================================
echo HealthConnect Backend Startup
echo ========================================

REM Change to the backend directory first
cd /d "C:\Users\91706\Desktop\new\Meditech\backend"

REM Clear any existing JAVA_HOME and set new one
set JAVA_HOME=
set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
set "PATH=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21\bin;%PATH%"

echo Current directory: %CD%
echo JAVA_HOME: %JAVA_HOME%
echo.

echo Testing Java installation...
java -version
echo.

echo Testing Java Compiler...
javac -version
echo.

echo Starting Maven build...
echo.

REM Run Maven
mvnw.cmd spring-boot:run

echo.
echo Backend stopped.
pause
