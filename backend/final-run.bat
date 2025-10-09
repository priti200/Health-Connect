@echo off
echo ========================================
echo HealthConnect Backend - Final Attempt
echo ========================================

cd /d "C:\Users\91706\Desktop\new\Meditech\backend"

set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"

echo JAVA_HOME: %JAVA_HOME%
echo Testing Java...
"%JAVA_EXE%" -version
echo.

echo Starting HealthConnect Backend...
echo.

REM Set environment and run Maven
set JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21
set PATH=%JAVA_HOME%\bin;%PATH%

echo Running Maven wrapper...
mvnw.cmd spring-boot:run

pause
