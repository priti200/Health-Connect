@echo off
echo Starting HealthConnect Backend...

set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
java -version

echo.
echo Starting Maven...
mvnw.cmd spring-boot:run
