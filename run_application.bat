@echo off
echo ========================================
echo    FYP2 Project - Quick Run Script
echo ========================================
echo.

:: Set error handling
setlocal enabledelayedexpansion

echo Starting FYP2 Application...
echo.

:: Check if we're in the right directory
if not exist "js\package.json" (
    echo Error: js\package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "pom.xml" (
    echo Error: pom.xml not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo Step 1: Building Java application...
echo.

:: Build Java application
mvn clean compile
if %errorlevel% neq 0 (
    echo Failed to build Java application.
    echo Please ensure Maven is installed and configured properly.
    pause
    exit /b 1
)

echo Java application built successfully.
echo.

echo Step 2: Installing Node.js dependencies...
echo.

:: Install server dependencies
cd js
echo Installing server dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies.
    echo Please ensure Node.js and npm are installed.
    pause
    exit /b 1
)

:: Install client dependencies
cd client
echo Installing client dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies.
    echo Please ensure Node.js and npm are installed.
    pause
    exit /b 1
)

cd ..
echo Node.js dependencies installed successfully.
echo.

echo Step 3: Starting the application...
echo.

:: Start the Node.js application in development mode
echo Starting the Sentinel React App...
echo The React app will be available at http://localhost:3001
echo The backend API will be available at http://localhost:3000
echo.
echo Press Ctrl+C to stop the application.
echo.

call npm run dev

pause
