@echo off
echo ========================================
echo    FYP2 Project - Complete Setup
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Not running as administrator.
    echo Some operations may require administrator privileges.
    echo.
)

echo This script will set up the complete FYP2 project environment.
echo.

:: Create tools directory
if not exist "tools" mkdir "tools"
cd tools

echo Step 1: Setting up portable Java...
echo.

:: Download and setup portable Java (OpenJDK 11)
if not exist "openjdk-11" (
    echo Downloading OpenJDK 11...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_windows-x64_bin.zip' -OutFile 'openjdk-11.zip' -UseBasicParsing } catch { Write-Host 'Failed to download OpenJDK 11' }"
    
    if exist "openjdk-11.zip" (
        echo Extracting OpenJDK 11...
        powershell -Command "try { Expand-Archive -Path 'openjdk-11.zip' -DestinationPath '.' -Force } catch { Write-Host 'Failed to extract OpenJDK 11' }"
        
        :: Rename the extracted folder
        for /d %%i in (jdk-*) do (
            if exist "%%i" (
                ren "%%i" "openjdk-11"
            )
        )
        
        del "openjdk-11.zip" 2>nul
        echo OpenJDK 11 setup complete.
    ) else (
        echo Failed to download OpenJDK 11. Please download manually.
    )
) else (
    echo OpenJDK 11 already exists.
)

echo.
echo Step 2: Setting up portable Maven...
echo.

:: Download and setup portable Maven
if not exist "maven" (
    echo Downloading Maven 3.9.6...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip' -OutFile 'maven.zip' -UseBasicParsing } catch { Write-Host 'Failed to download Maven' }"
    
    if exist "maven.zip" (
        echo Extracting Maven...
        powershell -Command "try { Expand-Archive -Path 'maven.zip' -DestinationPath '.' -Force } catch { Write-Host 'Failed to extract Maven' }"
        
        :: Rename the extracted folder
        for /d %%i in (apache-maven-*) do (
            if exist "%%i" (
                ren "%%i" "maven"
            )
        )
        
        del "maven.zip" 2>nul
        echo Maven setup complete.
    ) else (
        echo Failed to download Maven. Please download manually.
    )
) else (
    echo Maven already exists.
)

echo.
echo Step 3: Setting up portable Node.js...
echo.

:: Download and setup portable Node.js
if not exist "node" (
    echo Downloading Node.js LTS...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip' -OutFile 'node.zip' -UseBasicParsing } catch { Write-Host 'Failed to download Node.js' }"
    
    if exist "node.zip" (
        echo Extracting Node.js...
        powershell -Command "try { Expand-Archive -Path 'node.zip' -DestinationPath '.' -Force } catch { Write-Host 'Failed to extract Node.js' }"
        
        :: Rename the extracted folder
        for /d %%i in (node-v*) do (
            if exist "%%i" (
                ren "%%i" "node"
            )
        )
        
        del "node.zip" 2>nul
        echo Node.js setup complete.
    ) else (
        echo Failed to download Node.js. Please download manually.
    )
) else (
    echo Node.js already exists.
)

cd ..

echo.
echo Step 4: Creating run script...
echo.

:: Create the main run script
(
echo @echo off
echo echo ========================================
echo echo    FYP2 Project - Running Application
echo echo ========================================
echo echo.
echo.
echo :: Set up portable tools paths
echo set "JAVA_HOME=%~dp0tools\openjdk-11"
echo set "MAVEN_HOME=%~dp0tools\maven"
echo set "NODE_HOME=%~dp0tools\node"
echo.
echo :: Add to PATH for this session
echo set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%NODE_HOME%;%PATH%"
echo.
echo echo Verifying tools...
echo echo Java:
echo "%JAVA_HOME%\bin\java.exe" -version 2^>nul
echo if %%errorlevel%% neq 0 ^(
echo     echo Java not found at %JAVA_HOME%
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo Maven:
echo "%MAVEN_HOME%\bin\mvn.cmd" -version 2^>nul
echo if %%errorlevel%% neq 0 ^(
echo     echo Maven not found at %MAVEN_HOME%
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo Node.js:
echo "%NODE_HOME%\node.exe" -v 2^>nul
echo if %%errorlevel%% neq 0 ^(
echo     echo Node.js not found at %NODE_HOME%
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo.
echo echo Step 1: Testing Java application...
echo echo.
echo echo Running Java application ^(Pakistan Rainfall Data Fetcher^)...
echo echo You can test it by entering a location like "Swat, Pakistan"
echo echo.
echo "%JAVA_HOME%\bin\java.exe" -jar target\pakistan-rainfall-1.0.0.jar
echo echo.
echo echo Java application test complete. Press any key to continue...
echo pause
echo.
echo echo Step 2: Setting up Node.js application...
echo echo.
echo.
echo cd js
echo echo Installing server dependencies...
echo "%NODE_HOME%\npm.cmd" install
echo if %%errorlevel%% neq 0 ^(
echo     echo Failed to install server dependencies.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo cd client
echo echo Installing client dependencies...
echo "%NODE_HOME%\npm.cmd" install
echo if %%errorlevel%% neq 0 ^(
echo     echo Failed to install client dependencies.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo cd ..
echo echo.
echo echo Step 3: Starting the full application...
echo echo.
echo echo The application will be available at:
echo echo - Frontend ^(React^): http://localhost:3001
echo echo - Backend API: http://localhost:3000
echo echo.
echo echo Press Ctrl+C to stop the application.
echo echo.
echo.
echo "%NODE_HOME%\npm.cmd" run dev
echo.
echo pause
) > RUN_FYP2.bat

echo Created RUN_FYP2.bat
echo.

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo To run the application:
echo 1. Double-click RUN_FYP2.bat
echo 2. The script will test the Java application first
echo 3. Then it will start the Node.js/React application
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3001
echo - Backend: http://localhost:3000
echo.

pause
