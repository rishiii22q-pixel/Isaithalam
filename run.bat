@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
set "MAVEN_HOME=C:\ProgramData\chocolatey\lib\maven\apache-maven-3.9.12"
set "PATH=%MAVEN_HOME%\bin;%JAVA_HOME%\bin;%PATH%"

echo === Environment Configured ===
echo JAVA_HOME: %JAVA_HOME%
echo MAVEN_HOME: %MAVEN_HOME%
echo ==============================

call mvn spring-boot:run -DskipTests
