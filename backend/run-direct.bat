@echo off
echo ========================================
echo HealthConnect Backend Direct Startup
echo ========================================

cd /d "C:\Users\91706\Desktop\new\Meditech\backend"

set "JAVA_EXE=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21\bin\java.exe"

echo Testing Java...
"%JAVA_EXE%" -version
echo.

echo Building classpath...
set "CP=target\classes"
for %%i in (target\dependency\*.jar) do set "CP=!CP!;%%i"

echo Classpath: %CP%
echo.

echo Starting HealthConnect Application...
"%JAVA_EXE%" -cp "%CP%" com.healthconnect.HealthConnectApplication

pause
