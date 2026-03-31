@echo off
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        Playquiem — Android APK Builder               ║
echo  ║  Run this ONCE to set up, then BUILD.bat to rebuild  ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── Step 1: Check Node ──────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js found

:: ── Step 2: Get your WiFi IP ────────────────────────────────
echo.
echo Your PC's WiFi IP addresses:
ipconfig | findstr /i "IPv4"
echo.
set /p USER_IP="Enter your WiFi IP (e.g. 192.168.1.42): "

:: ── Step 3: Write .env with the IP ──────────────────────────
echo VITE_API_URL=http://%USER_IP%:8000 > frontend\.env
echo [OK] API URL set to http://%USER_IP%:8000

:: ── Step 4: Install frontend deps ───────────────────────────
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 ( echo [ERROR] npm install failed & pause & exit /b 1 )
echo [OK] Dependencies installed

:: ── Step 5: Build the React app ─────────────────────────────
echo.
echo Building React app...
call npm run build
if errorlevel 1 ( echo [ERROR] Build failed & pause & exit /b 1 )
echo [OK] Build complete

:: ── Step 6: Init Capacitor + add Android ────────────────────
echo.
echo Setting up Capacitor...
call npx cap init Playquiem com.playquiem.app --web-dir dist 2>nul
call npx cap add android 2>nul
call npx cap sync android
echo [OK] Capacitor ready

:: ── Step 7: Open Android Studio ─────────────────────────────
echo.
echo Opening Android Studio...
echo.
echo  ┌─────────────────────────────────────────────────────┐
echo  │  IN ANDROID STUDIO:                                 │
echo  │                                                     │
echo  │  1. Wait for Gradle sync to finish                  │
echo  │  2. Click Build ^> Build Bundle/APK ^> Build APK    │
echo  │  3. APK will be in:                                 │
echo  │     android\app\build\outputs\apk\debug\           │
echo  │  4. Transfer app-debug.apk to your phone            │
echo  │  5. On phone: Settings ^> Install unknown apps ^> ON │
echo  │  6. Open the APK file to install                    │
echo  └─────────────────────────────────────────────────────┘
echo.
echo  IMPORTANT: Keep the backend running on your PC:
echo  python -m uvicorn main:app --host 0.0.0.0 --port 8000
echo  (the --host 0.0.0.0 flag lets your phone connect to it)
echo.
call npx cap open android
cd ..
pause
