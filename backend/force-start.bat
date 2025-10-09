@echo off
echo ========================================
echo HealthConnect Backend Force Start
echo ========================================

cd /d "C:\Users\91706\Desktop\new\Meditech\backend"

REM Backup current JAVA_HOME
set "OLD_JAVA_HOME=%JAVA_HOME%"

REM Force set JAVA_HOME
set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"

echo Old JAVA_HOME: %OLD_JAVA_HOME%
echo New JAVA_HOME: %JAVA_HOME%
echo.

echo Testing Java...
"%JAVA_HOME%\bin\java.exe" -version
echo.

echo Testing javac...
"%JAVA_HOME%\bin\javac.exe" -version
echo.

echo Starting Maven wrapper...
call mvnw.cmd spring-boot:run

REM Restore JAVA_HOME
set "JAVA_HOME=%OLD_JAVA_HOME%"

pause
