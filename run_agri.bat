@echo off
title AgriSmart AI - Startup
color 0A

echo =======================================================
echo            Starting AgriSmart AI Project
echo =======================================================
echo.

:: Ensure we are in the directory of the batch file
cd /d "%~dp0"

:: Check if node_modules exists, if not run npm install
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    echo.
)

:: Start the development server
echo [INFO] Starting the development server...
echo [INFO] The browser will open automatically in a few seconds.
echo.

:: Launch the browser in the background after 5 seconds to give server time to start
start /b cmd /c "timeout /t 5 >nul & start http://localhost:5000"

call npm run dev

pause
