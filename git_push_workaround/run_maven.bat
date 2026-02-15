@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "MAVEN_OPTS=-Dfile.encoding=UTF-8"
echo === Cleaning target ===
if exist "E:\projectt\target" rmdir /s /q "E:\projectt\target"
echo === Running Maven compile ===
call C:\maven\bin\mvn.cmd compile -DskipTests -B --no-transfer-progress -e 2>&1
echo.
echo === EXIT CODE: %ERRORLEVEL% ===
