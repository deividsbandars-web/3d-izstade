@echo off
setlocal
cd /d "%~dp0"

echo ===============================
echo WARPALA EXPO STREAMING STACK
echo ===============================
echo.
echo This starts the Docker gateway stack:
echo - frontend
echo - backend
echo - signaling
echo - TURN
echo - sync-server
echo.
echo It does NOT launch Unreal itself.
echo Unreal must connect as streamer id: booth-sponsor-concierge
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-expo-pixel-streaming-stack.ps1" %*
set EXITCODE=%ERRORLEVEL%

echo.
if %EXITCODE% NEQ 0 (
  echo Stack start failed. Check the error above.
) else (
  echo Stack start finished.
)
pause
exit /b %EXITCODE%
