@echo off
echo ========================================
echo   Installing Dependencies
echo   This may take 2-5 minutes...
echo ========================================
echo.

echo [1/2] Installing Backend Dependencies...
cd server
call npm install --verbose
if errorlevel 1 (
    echo.
    echo ERROR: Backend installation failed!
    echo Try: npm cache clean --force
    pause
    exit /b 1
)

echo.
echo [2/2] Installing Frontend Dependencies...
cd ..\client
call npm install --verbose
if errorlevel 1 (
    echo.
    echo ERROR: Frontend installation failed!
    echo Try: npm cache clean --force
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Now you can:
echo   1. Double-click START.bat
echo   OR
echo   2. Run: npm run dev in server and client folders
echo.
pause
