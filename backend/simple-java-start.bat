@echo off
echo Starting HealthConnect Backend with Simple Java...

REM Set JAVA_HOME
set "JAVA_HOME=C:\Users\91706\AppData\Roaming\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java Version:
java -version

echo.
echo Starting backend...

REM Change to backend directory
cd /d "%~dp0"

REM Build classpath with Maven dependencies
set "M2_REPO=%USERPROFILE%\.m2\repository"
set "CLASSPATH=target\classes"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\boot\spring-boot-starter-web\3.4.5\spring-boot-starter-web-3.4.5.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\boot\spring-boot-starter\3.4.5\spring-boot-starter-3.4.5.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\boot\spring-boot\3.4.5\spring-boot-3.4.5.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\boot\spring-boot-autoconfigure\3.4.5\spring-boot-autoconfigure-3.4.5.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\spring-core\6.2.1\spring-core-6.2.1.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\spring-context\6.2.1\spring-context-6.2.1.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\spring-web\6.2.1\spring-web-6.2.1.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\spring-webmvc\6.2.1\spring-webmvc-6.2.1.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\org\springframework\boot\spring-boot-starter-data-jpa\3.4.5\spring-boot-starter-data-jpa-3.4.5.jar"
set "CLASSPATH=%CLASSPATH%;%M2_REPO%\com\h2database\h2\2.3.232\h2-2.3.232.jar"

echo Classpath: %CLASSPATH%
echo.

REM Run the application
java -cp "%CLASSPATH%" com.healthconnect.HealthConnectApplication

pause
