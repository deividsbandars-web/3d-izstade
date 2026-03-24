@echo off
setlocal
title Warpala Pixel Streaming Launcher
color 0A

set "UE_EDITOR=C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe"
set "UE_PROJECT=C:\3d\WarpalaUE5\WarpalaUE5.uproject"
set "UE_MAP=/Game/Warpala/Maps/WarpalaCity_Main"
set "SIGNALING_HOST=127.0.0.1"
set "SIGNALING_STREAMER_PORT=8888"
set "PIXEL_STREAMING_CONNECTION_URL=ws://%SIGNALING_HOST%:%SIGNALING_STREAMER_PORT%"
set "BACKEND_STATUS_URL=http://127.0.0.1/api/pixel-streaming/status"
set "EXIT_CODE=0"
set "NO_PAUSE=0"

if /I "%~1"=="--no-pause" set "NO_PAUSE=1"

echo ================================================
echo   WARPALA CITY - PIXEL STREAMING LAUNCHER
echo ================================================
echo.

if not exist "%UE_EDITOR%" (
    echo [ERROR] Unreal Editor nav atrasts: %UE_EDITOR%
    set "EXIT_CODE=1"
    goto :finish
)

if not exist "%UE_PROJECT%" (
    echo [ERROR] Unreal projekts nav atrasts: %UE_PROJECT%
    set "EXIT_CODE=1"
    goto :finish
)

echo [0/3] Gaidam signaling streamer socketu uz %SIGNALING_HOST%:%SIGNALING_STREAMER_PORT% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(60); while((Get-Date) -lt $deadline){ try { $client = New-Object System.Net.Sockets.TcpClient; $async = $client.BeginConnect('%SIGNALING_HOST%', %SIGNALING_STREAMER_PORT%, $null, $null); if($async.AsyncWaitHandle.WaitOne(1000, $false) -and $client.Connected){ $client.EndConnect($async); $client.Close(); exit 0 } $client.Close() } catch {} Start-Sleep -Seconds 1 } exit 1"
if errorlevel 1 (
    echo [ERROR] Signaling streamer ports nav sasniedzams uz %PIXEL_STREAMING_CONNECTION_URL%
    echo [HINT] Vispirms palaid docker compose up -d --build
    set "EXIT_CODE=1"
    goto :finish
)

echo [1/3] Startejam WarpalaUE5 ar Pixel Streaming ...
echo       UE project       : %UE_PROJECT%
echo       Direct streamer  : %PIXEL_STREAMING_CONNECTION_URL%
echo       Browser gateway  : http://127.0.0.1 ^(premium uses /ws/ only for browser clients^)
start "" "%UE_EDITOR%" "%UE_PROJECT%" -game -map=%UE_MAP% -ResX=1280 -ResY=720 -AudioMixer -PixelStreamingConnectionURL="%PIXEL_STREAMING_CONNECTION_URL%" -RenderOffScreen -dx12 -unattended

echo [2/3] Gaidam lidz premium runtime statuss kļust session_ready ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(90); do { try { $status = Invoke-RestMethod -Uri '%BACKEND_STATUS_URL%' -TimeoutSec 5; $activeStreamerId = if ($status.session -and $status.session.activeStreamerId) { $status.session.activeStreamerId } else { 'none' }; Write-Host ('[WAIT] signaling=' + $status.signaling + ' streamer=' + $status.streamer + ' readiness=' + $status.readiness + ' activeStreamerId=' + $activeStreamerId); if ($status.readiness -eq 'session_ready') { exit 0 } } catch { Write-Host ('[WAIT] status fetch failed: ' + $_.Exception.Message) } Start-Sleep -Seconds 5 } while((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo [WARN] Session_ready netika sasniegts 90 sekunzu laikaa. Paradu pēdejo redzamo statusu.
)

echo [3/3] Parbaudam premium runtime status ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $status = Invoke-RestMethod -Uri '%BACKEND_STATUS_URL%' -TimeoutSec 5; $activeStreamerId = if ($status.session -and $status.session.activeStreamerId) { $status.session.activeStreamerId } else { 'none' }; Write-Host ('[STATUS] signaling=' + $status.signaling + ' streamer=' + $status.streamer + ' readiness=' + $status.readiness + ' activeStreamerId=' + $activeStreamerId); if ($status.warnings) { Write-Host ('[WARNINGS] ' + ($status.warnings -join ', ')) } } catch { Write-Host ('[ERROR] Failed to query %BACKEND_STATUS_URL%: ' + $_.Exception.Message); exit 1 }"
if errorlevel 1 (
    set "EXIT_CODE=1"
)

echo.
echo ================================================
echo   Pixel Streaming launcher pabeigts.
echo   Ja streamer joprojam nav pieejams, skaties:
echo   - docker compose logs signaling
echo   - WarpalaUE5\\Saved\\Logs\\WarpalaUE5.log
echo ================================================
echo.

:finish
if "%NO_PAUSE%"=="1" (
    endlocal & exit /b %EXIT_CODE%
)

echo Lai apturetu - aizver so logu un apturi Docker konteinerus.
pause
endlocal & exit /b %EXIT_CODE%
