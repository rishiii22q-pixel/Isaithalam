@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "MAVEN_OPTS=-Dfile.encoding=UTF-8"
echo Running Maven clean compile...
call C:\maven\bin\mvn.cmd clean compile -DskipTests -B -e 2>&1
echo.
echo Exit code: %ERRORLEVEL%
