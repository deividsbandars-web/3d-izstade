@echo off
setlocal
cd /d "%~dp0"

echo ===============================
echo WARPALA COMMERCIAL DEMO START
echo ===============================
echo.
echo This starts:
echo - Docker gateway stack
echo - Web3D frontend
echo - backend API
echo - signaling / TURN
echo - Unreal PixelStreaming2 streamer
echo.
echo Use Ctrl+C in this window only if startup is stuck.
echo Unreal opens in its own window.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-warpala-commercial-demo.ps1" -OpenBrowser %*
set EXITCODE=%ERRORLEVEL%

echo.
if %EXITCODE% NEQ 0 (
  echo Commercial demo start failed. Check the error above.
) else (
  echo Commercial demo start finished.
)
pause
exit /b %EXITCODE%
