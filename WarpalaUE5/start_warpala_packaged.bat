@echo off
setlocal
title Warpala Packaged Pixel Streaming Launcher
color 0A

set "PACKAGED_EXE=C:\3d\WarpalaUE5\Saved\Windows\WarpalaUE5.exe"
set "API_ORIGIN=https://api.30sek24.com"
set "SIGNALING_HOST=api.30sek24.com"
set "SIGNALING_STREAMER_PORT=8888"
set "PIXEL_STREAMING_CONNECTION_URL=ws://%SIGNALING_HOST%:%SIGNALING_STREAMER_PORT%"
set "BACKEND_STATUS_URL=%API_ORIGIN%/api/pixel-streaming/status"
set "BROWSER_GATEWAY_URL=%API_ORIGIN%"
set "EXIT_CODE=0"
set "NO_PAUSE=0"
set "LOCAL_MODE=0"

for %%A in (%*) do (
    if /I "%%~A"=="--no-pause" set "NO_PAUSE=1"
    if /I "%%~A"=="--local" set "LOCAL_MODE=1"
)

if defined WARPALA_PACKAGED_EXE set "PACKAGED_EXE=%WARPALA_PACKAGED_EXE%"
if defined WARPALA_API_ORIGIN set "API_ORIGIN=%WARPALA_API_ORIGIN%"
if defined WARPALA_SIGNALING_HOST set "SIGNALING_HOST=%WARPALA_SIGNALING_HOST%"
if defined WARPALA_SIGNALING_STREAMER_PORT set "SIGNALING_STREAMER_PORT=%WARPALA_SIGNALING_STREAMER_PORT%"
if defined WARPALA_BACKEND_STATUS_URL set "BACKEND_STATUS_URL=%WARPALA_BACKEND_STATUS_URL%"
if defined WARPALA_BROWSER_GATEWAY_URL set "BROWSER_GATEWAY_URL=%WARPALA_BROWSER_GATEWAY_URL%"

if "%LOCAL_MODE%"=="1" (
    set "API_ORIGIN=http://127.0.0.1:3000"
    set "SIGNALING_HOST=127.0.0.1"
    set "SIGNALING_STREAMER_PORT=8888"
    set "BACKEND_STATUS_URL=http://127.0.0.1:3000/api/pixel-streaming/status"
    set "BROWSER_GATEWAY_URL=http://127.0.0.1"
)

set "PIXEL_STREAMING_CONNECTION_URL=ws://%SIGNALING_HOST%:%SIGNALING_STREAMER_PORT%"

echo ================================================
echo   WARPALA PACKAGED PIXEL STREAMING LAUNCHER
echo ================================================
echo.
echo       Packaged exe     : %PACKAGED_EXE%
echo       API origin       : %API_ORIGIN%
echo       Browser gateway  : %BROWSER_GATEWAY_URL%
echo       Status endpoint  : %BACKEND_STATUS_URL%
echo.

if not exist "%PACKAGED_EXE%" (
    echo [ERROR] Packaged build nav atrasts: %PACKAGED_EXE%
    echo [HINT] Vispirms uztaisi Windows package no Unreal projekta.
    set "EXIT_CODE=1"
    goto :finish
)

echo [0/3] Gaidam signaling streamer socketu uz %SIGNALING_HOST%:%SIGNALING_STREAMER_PORT% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(60); while((Get-Date) -lt $deadline){ try { $client = New-Object System.Net.Sockets.TcpClient; $async = $client.BeginConnect('%SIGNALING_HOST%', %SIGNALING_STREAMER_PORT%, $null, $null); if($async.AsyncWaitHandle.WaitOne(1000, $false) -and $client.Connected){ $client.EndConnect($async); $client.Close(); exit 0 } $client.Close() } catch {} Start-Sleep -Seconds 1 } exit 1"
if errorlevel 1 (
    echo [ERROR] Signaling streamer ports nav sasniedzams uz %PIXEL_STREAMING_CONNECTION_URL%
    echo [HINT] Vispirms parbaudi VPS docker stack un api.30sek24.com.
    set "EXIT_CODE=1"
    goto :finish
)

echo [1/3] Startejam packaged Warpala build ar Pixel Streaming ...
echo       Direct streamer  : %PIXEL_STREAMING_CONNECTION_URL%
echo       Browser gateway  : %BROWSER_GATEWAY_URL%
start "" "%PACKAGED_EXE%" -ResX=1280 -ResY=720 -AudioMixer -PixelStreamingConnectionURL="%PIXEL_STREAMING_CONNECTION_URL%" -RenderOffScreen -dx12 -Unattended -log

echo [2/3] Gaidam lidz premium runtime statuss klust session_ready ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(90); do { try { $status = Invoke-RestMethod -Uri '%BACKEND_STATUS_URL%' -TimeoutSec 5; $activeStreamerId = if ($status.session -and $status.session.activeStreamerId) { $status.session.activeStreamerId } else { 'none' }; Write-Host ('[WAIT] signaling=' + $status.signaling + ' streamer=' + $status.streamer + ' readiness=' + $status.readiness + ' activeStreamerId=' + $activeStreamerId); if ($status.readiness -eq 'session_ready') { exit 0 } } catch { Write-Host ('[WAIT] status fetch failed: ' + $_.Exception.Message) } Start-Sleep -Seconds 5 } while((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo [WARN] Session_ready netika sasniegts 90 sekunzu laikaa. Paradu pedejo redzamo statusu.
)

echo [3/3] Parbaudam premium runtime status ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $status = Invoke-RestMethod -Uri '%BACKEND_STATUS_URL%' -TimeoutSec 5; $activeStreamerId = if ($status.session -and $status.session.activeStreamerId) { $status.session.activeStreamerId } else { 'none' }; Write-Host ('[STATUS] signaling=' + $status.signaling + ' streamer=' + $status.streamer + ' readiness=' + $status.readiness + ' activeStreamerId=' + $activeStreamerId); if ($status.warnings) { Write-Host ('[WARNINGS] ' + ($status.warnings -join ', ')) } } catch { Write-Host ('[ERROR] Failed to query %BACKEND_STATUS_URL%: ' + $_.Exception.Message); exit 1 }"
if errorlevel 1 (
    set "EXIT_CODE=1"
)

echo.
echo ================================================
echo   Packaged Pixel Streaming launcher pabeigts.
echo   Ja streamer joprojam nav pieejams, skaties:
echo   - docker compose logs signaling uz VPS
echo   - packaged build logus
echo ================================================
echo.

:finish
if "%NO_PAUSE%"=="1" (
    endlocal & exit /b %EXIT_CODE%
)

pause
endlocal & exit /b %EXIT_CODE%
