@echo off
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║    Playquiem — Rebuild APK               ║
echo  ╚══════════════════════════════════════════╝
echo.

cd frontend
echo Building React app...
call npm run build
if errorlevel 1 ( echo [ERROR] Build failed & pause & exit /b 1 )

echo Syncing with Android...
call npx cap sync android

echo.
echo [OK] Done! Now open Android Studio and click Build ^> Build APK
echo.
call npx cap open android
cd ..
pause
