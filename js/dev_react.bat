@echo off
setlocal enabledelayedexpansion
echo Starting Sentinel React App in Development Mode...
echo.

echo Clearing ports 3000 and 3001...
echo.

REM Kill all Node.js processes (this will clear both ports)
echo Terminating any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   Node.js processes terminated.
) else (
    echo   No Node.js processes found.
)

REM Also specifically check and kill processes on ports 3000 and 3001
echo Checking for processes on ports 3000 and 3001...

REM Port 3000 (Backend server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   Found process on port 3000, terminating...
    taskkill /F /PID %%a >nul 2>&1
)

REM Port 3001 (React dev server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo   Found process on port 3001, terminating...
    taskkill /F /PID %%a >nul 2>&1
)

echo Ports cleared. Waiting 2 seconds for cleanup...
timeout /t 2 /nobreak >nul
echo.

echo Installing dependencies if needed...
call ..\\tools\\node\\npm.cmd install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    pause
    exit /b 1
)

cd client
call ..\\..\\tools\\node\\npm.cmd install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    pause
    exit /b 1
)

cd ..

echo Starting development server...
echo The React app will be available at http://localhost:3001
echo The backend API will be available at http://localhost:3000
echo.
set BROWSER=msedge
call ..\\tools\\node\\npm.cmd run dev

pause
