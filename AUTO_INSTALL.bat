@echo off
echo ========================================
echo    FYP2 Project - Auto Installer
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as administrator.
    echo Right-click on this file and select "Run as administrator"
    pause
    exit /b 1
)

echo This script will automatically download and install:
echo 1. Java JDK 11
echo 2. Maven 3.9.6
echo 3. Node.js LTS
echo.

set /p choice="Do you want to continue? (y/n): "
if /i not "%choice%"=="y" (
    echo Installation cancelled.
    pause
    exit /b 0
)

:: Create downloads directory
if not exist "%TEMP%\FYP2_Install" mkdir "%TEMP%\FYP2_Install"
cd /d "%TEMP%\FYP2_Install"

echo.
echo Step 1: Downloading Java JDK 11...
echo.

:: Download Java JDK 11 (using a direct download link)
echo Downloading Java JDK 11...
powershell -Command "& {Invoke-WebRequest -Uri 'https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.exe' -OutFile 'jdk-17_windows-x64_bin.exe' -UseBasicParsing}"

if not exist "jdk-17_windows-x64_bin.exe" (
    echo Failed to download Java JDK. Please download manually from:
    echo https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
    echo.
    pause
    exit /b 1
)

echo Installing Java JDK...
jdk-17_windows-x64_bin.exe /s

echo.
echo Step 2: Downloading Maven...
echo.

:: Download Maven
echo Downloading Maven 3.9.6...
powershell -Command "& {Invoke-WebRequest -Uri 'https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip' -OutFile 'apache-maven-3.9.6-bin.zip' -UseBasicParsing}"

if not exist "apache-maven-3.9.6-bin.zip" (
    echo Failed to download Maven. Please download manually from:
    echo https://maven.apache.org/download.cgi
    echo.
    pause
    exit /b 1
)

:: Extract Maven
echo Extracting Maven...
powershell -Command "& {Expand-Archive -Path 'apache-maven-3.9.6-bin.zip' -DestinationPath 'C:\Program Files\Apache\maven' -Force}"

echo.
echo Step 3: Downloading Node.js...
echo.

:: Download Node.js
echo Downloading Node.js LTS...
powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile 'node-v20.10.0-x64.msi' -UseBasicParsing}"

if not exist "node-v20.10.0-x64.msi" (
    echo Failed to download Node.js. Please download manually from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Installing Node.js...
msiexec /i node-v20.10.0-x64.msi /quiet

echo.
echo Step 4: Setting up environment variables...
echo.

:: Set JAVA_HOME (assuming default installation path)
setx JAVA_HOME "C:\Program Files\Java\jdk-17" /M

:: Set MAVEN_HOME
setx MAVEN_HOME "C:\Program Files\Apache\maven\apache-maven-3.9.6" /M

:: Add to PATH
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH') do set "currentPath=%%b"
setx PATH "%currentPath%;%JAVA_HOME%\bin;%MAVEN_HOME%\bin" /M

echo.
echo Step 5: Cleaning up...
echo.

:: Clean up downloads
cd /d "%~dp0"
rmdir /s /q "%TEMP%\FYP2_Install"

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Please restart your computer for environment variables to take effect.
echo After restart, you can run: run_application.bat
echo.

pause
