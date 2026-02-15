@echo off
echo ==========================================
echo Setting up Git for Isai Thalam...
echo ==========================================

REM Kill any lingering processes
taskkill /F /IM java.exe 2>nul
taskkill /F /IM git.exe 2>nul
taskkill /F /IM code.exe 2>nul

REM Clean up old git folders
if exist .git (
    echo Removing old .git folder...
    rmdir /s /q .git
)
if exist .git_old (
    rmdir /s /q .git_old
)

REM Initialize Git
echo Initializing Git repository...
git init -b main
if %errorlevel% neq 0 (
    echo Failed to initialize git. Please check permissions or antivirus.
    pause
    exit /b %errorlevel%
)

REM Configure
git config user.name "Antigravity Agent"
git config user.email "agent@antigravity.dev"

REM Add files
echo Adding files...
git add .
git commit -m "Initial commit of Isai Thalam Music Platform"

REM Add remote
echo Adding remote...
git remote add origin https://github.com/rishiii22q-pixel/Isaithalam

REM Push
echo Pushing to GitHub...
git push -u origin main

echo ==========================================
echo Done! checkout https://github.com/rishiii22q-pixel/Isaithalam
echo ==========================================
pause
