@echo off
echo Building and starting Sentinel React App...
echo.

echo Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    pause
    exit /b 1
)

echo Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo Failed to build React app
    pause
    exit /b 1
)

cd ..

echo Installing server dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    pause
    exit /b 1
)

echo Starting server...
call npm start

pause
