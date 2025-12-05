@echo off
echo ========================================
echo   ServerSentinel - Simple Start
echo   (No Docker/Database Required!)
echo ========================================
echo.

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
echo.

cd server
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

cd ../client
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

cd ..

echo.
echo ========================================
echo   Starting ServerSentinel...
echo ========================================
echo.
echo Opening 2 terminal windows:
echo   1. Backend (port 3000)
echo   2. Frontend (port 5173)
echo.
echo Wait for both to start, then open:
echo   http://localhost:5173
echo.
echo Login: admin@serversentinel.io
echo Password: password123
echo ========================================
echo.

start "ServerSentinel Backend" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "ServerSentinel Frontend" cmd /k "cd client && npm run dev"

echo.
echo Both terminals opened!
echo Close this window when done.
pause
