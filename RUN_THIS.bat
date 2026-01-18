@echo off
echo ===================================
echo Deploy Cloud Functions
echo ===================================
echo.

cd functions
echo [1/4] Installing dependencies...
call npm install
echo.

echo [2/4] Building...
call npm run build
echo.

echo [3/4] Deploying to Firebase...
call npm run deploy
echo.

echo ===================================
echo Deploy Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Enable FCM API: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=pharmanow-754a7
echo 2. Test at: http://localhost:5173/admin/notifications
echo 3. Check logs: firebase functions:log
echo.
pause
