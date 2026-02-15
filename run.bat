@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "MAVEN_OPTS=-Dfile.encoding=UTF-8"
call C:\maven\bin\mvn.cmd spring-boot:run -DskipTests -B --no-transfer-progress
