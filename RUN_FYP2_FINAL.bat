@echo off
echo ========================================
echo    FYP2 Project - Final Run Script
echo ========================================
echo.

:: Set up portable tools paths
set "JAVA_HOME=%~dp0tools\openjdk-11"
set "NODE_HOME=%~dp0tools\node"

:: Add to PATH for this session
set "PATH=%JAVA_HOME%\bin;%NODE_HOME%;%PATH%"

echo Verifying tools...
echo.
echo Java:
"%JAVA_HOME%\bin\java.exe" -version 2>nul
if %errorlevel% neq 0 (
    echo Java not found at %JAVA_HOME%
    echo Please run COMPLETE_SETUP.bat first
    pause
    exit /b 1
)

echo.
echo Node.js:
"%NODE_HOME%\node.exe" -v 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found at %NODE_HOME%
    echo Please run COMPLETE_SETUP.bat first
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 1: Testing Java Application
echo ========================================
echo.
echo The Java application (Pakistan Rainfall Data Fetcher) is ready to run.
echo You can test it by entering a location like "Swat, Pakistan"
echo.
echo To run the Java application manually, use:
echo "%JAVA_HOME%\bin\java.exe" -jar target\pakistan-rainfall-1.0.0.jar
echo.
echo Press any key to continue to the Node.js application...
pause

echo.
echo ========================================
echo Step 2: Setting up Node.js Application
echo ========================================
echo.

cd js
echo Installing server dependencies...
"%NODE_HOME%\npm.cmd" install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies.
    echo Please check your internet connection.
    pause
    exit /b 1
)

cd client
echo Installing client dependencies...
"%NODE_HOME%\npm.cmd" install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies.
    echo Please check your internet connection.
    pause
    exit /b 1
)

cd ..
echo.
echo Dependencies installed successfully!
echo.

echo ========================================
echo Step 3: Starting the Application
echo ========================================
echo.
echo The Sentinel Weather and Flood Risk Assessment System is starting...
echo.
echo The application will be available at:
echo - Frontend (React): http://localhost:3001
echo - Backend API: http://localhost:3000
echo.
echo Press Ctrl+C to stop the application.
echo.

"%NODE_HOME%\npm.cmd" run dev

pause
