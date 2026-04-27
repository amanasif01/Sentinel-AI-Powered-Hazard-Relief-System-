@echo off
echo ========================================
echo    FYP2 Project - Prerequisites Installer
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

echo This script will help you install the required prerequisites:
echo 1. Java JDK 11
echo 2. Maven 3.9.6
echo 3. Node.js (includes npm)
echo.

set /p choice="Do you want to continue? (y/n): "
if /i not "%choice%"=="y" (
    echo Installation cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Installing Java JDK 11...
echo.

:: Check if Java is already installed
java -version >nul 2>&1
if %errorlevel% equ 0 (
    echo Java is already installed.
    java -version
    echo.
) else (
    echo Java JDK 11 is not installed.
    echo.
    echo Please download and install Java JDK 11 from:
    echo https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
    echo.
    echo After installation, you will need to:
    echo 1. Set JAVA_HOME environment variable to the JDK installation path
    echo 2. Add %JAVA_HOME%\bin to your PATH environment variable
    echo.
    echo Example:
    echo JAVA_HOME = C:\Program Files\Java\jdk-11.0.21
    echo PATH = ...;%%JAVA_HOME%%\bin
    echo.
    pause
)

echo.
echo Step 2: Installing Maven 3.9.6...
echo.

:: Check if Maven is already installed
mvn -version >nul 2>&1
if %errorlevel% equ 0 (
    echo Maven is already installed.
    mvn -version
    echo.
) else (
    echo Maven is not installed.
    echo.
    echo Please download and install Maven 3.9.6 from:
    echo https://maven.apache.org/download.cgi
    echo.
    echo After installation, you will need to:
    echo 1. Extract the ZIP file to C:\Program Files\Apache\maven
    echo 2. Set MAVEN_HOME environment variable to the Maven installation path
    echo 3. Add %%MAVEN_HOME%%\bin to your PATH environment variable
    echo.
    echo Example:
    echo MAVEN_HOME = C:\Program Files\Apache\maven\apache-maven-3.9.6
    echo PATH = ...;%%MAVEN_HOME%%\bin
    echo.
    pause
)

echo.
echo Step 3: Installing Node.js...
echo.

:: Check if Node.js is already installed
node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js is already installed.
    node -v
    npm -v
    echo.
) else (
    echo Node.js is not installed.
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo Choose the LTS version (Long Term Support).
    echo The installer will automatically add Node.js and npm to your PATH.
    echo.
    pause
)

echo.
echo Step 4: Verifying installations...
echo.

echo Checking Java...
java -version
if %errorlevel% neq 0 (
    echo ERROR: Java is not working properly.
) else (
    echo Java is working correctly.
)

echo.
echo Checking Maven...
mvn -version
if %errorlevel% neq 0 (
    echo ERROR: Maven is not working properly.
) else (
    echo Maven is working correctly.
)

echo.
echo Checking Node.js...
node -v
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not working properly.
) else (
    echo Node.js is working correctly.
)

echo.
echo Checking npm...
npm -v
if %errorlevel% neq 0 (
    echo ERROR: npm is not working properly.
) else (
    echo npm is working correctly.
)

echo.
echo ========================================
echo Installation verification complete.
echo ========================================
echo.
echo If all tools are working correctly, you can now run:
echo run_application.bat
echo.
echo If there are any errors, please:
echo 1. Restart your computer after installing the tools
echo 2. Check that environment variables are set correctly
echo 3. Ensure the tools are added to your PATH
echo.

pause
