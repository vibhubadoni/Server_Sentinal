@echo off
echo ========================================
echo   Restarting ServerSentinel Servers
echo ========================================
echo.

echo Killing existing processes on ports 3000 and 5173...
npx kill-port 3000 2>nul
npx kill-port 5173 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Starting Backend...
start "ServerSentinel Backend" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "ServerSentinel Frontend" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo   Both servers restarted!
echo ========================================
echo.
echo Wait 10 seconds, then open:
echo   http://localhost:5173
echo.
echo Login: admin@serversentinel.io
echo Password: password123
echo.
pause
