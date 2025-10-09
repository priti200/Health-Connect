@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-23
set PATH=%JAVA_HOME%\bin;%PATH%

echo Starting HealthConnect Backend...
echo Java Home: %JAVA_HOME%
echo Java Version:
java -version

echo.
echo Building classpath...
set CLASSPATH=target\classes

REM Add all JAR files from Maven repository
for /r "C:\Users\91706\.m2\repository" %%i in (*.jar) do (
    set CLASSPATH=!CLASSPATH!;%%i
)

echo.
echo Starting application...
java -cp "%CLASSPATH%" com.healthconnect.HealthConnectApplication

pause
