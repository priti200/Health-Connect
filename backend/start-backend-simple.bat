@echo off
echo Starting Meditech Backend...

REM Set JAVA_HOME to common Java installation paths
if exist "C:\Program Files\Java\jdk-23" (
    set JAVA_HOME=C:\Program Files\Java\jdk-23
) else if exist "C:\Program Files\Java\jdk-21" (
    set JAVA_HOME=C:\Program Files\Java\jdk-21
) else if exist "C:\Program Files\Java\jdk-17" (
    set JAVA_HOME=C:\Program Files\Java\jdk-17
) else if exist "C:\Program Files\Java\jdk-11" (
    set JAVA_HOME=C:\Program Files\Java\jdk-11
) else (
    echo Java JDK not found in standard locations.
    echo Please install Java JDK 17 or higher.
    pause
    exit /b 1
)

echo Using JAVA_HOME: %JAVA_HOME%
set PATH=%JAVA_HOME%\bin;%PATH%

echo Starting Spring Boot application...
call mvnw.cmd spring-boot:run

pause
