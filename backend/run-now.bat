@echo off
echo Starting HealthConnect Backend...

set JAVA_HOME=C:\Program Files\Java\jdk-23
set PATH=%JAVA_HOME%\bin;%PATH%

echo Compiling and running...
javac -cp "target\classes" -d target\classes src\main\java\com\healthconnect\HealthConnectApplication.java

if exist "target\classes\com\healthconnect\HealthConnectApplication.class" (
    echo Starting Spring Boot application...
    java -cp "target\classes" com.healthconnect.HealthConnectApplication
) else (
    echo Compilation failed, trying Maven...
    call mvnw.cmd spring-boot:run
)

pause
