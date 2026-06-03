@echo off
setlocal
cd /d "%~dp0"

echo ===============================
echo WARPALA UNREAL STREAMER START
echo ===============================
echo.
echo This starts the Unreal Editor streamer for the booth product viewer.
echo It expects the Docker gateway stack to be running first:
echo   start_warpala_streaming_stack.bat
echo.
echo Streamer id: booth-sponsor-concierge
echo Signaling:   ws://127.0.0.1:8888
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-warpala-unreal-streamer.ps1" -GenerateProjectFiles -Build %*
set EXITCODE=%ERRORLEVEL%

echo.
if %EXITCODE% NEQ 0 (
  echo Unreal streamer start failed. Check the error above.
) else (
  echo Unreal streamer finished.
)
pause
exit /b %EXITCODE%
