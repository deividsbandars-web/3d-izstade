@echo off
echo Tiram vecos procesus...
taskkill /F /IM UnrealEditor.exe /T >nul 2>&1
taskkill /F /IM WarpalaUE5.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo Startējam WarpalaUE5 Pixel Streaming (Optimized Mode)...
:: Samazinam bitrate uz 3000000 un pieliekam fix logu izmeram
start "" "C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe" "C:\3d\WarpalaUE5\WarpalaUE5.uproject" -game -ResX=1280 -ResY=720 -Windowed -AudioMixer -PixelStreamingURL=ws://127.0.0.1:8888 -PixelStreamingWebRTCMaxBitrate=3000000 -RenderOffScreen

echo Spēle tiek startēta fonā!

echo.
echo Startējam Signaling Server...
cd /d "C:\Program Files\Epic Games\UE_5.7\Engine\Plugins\Media\PixelStreaming\Resources\WebServers\SignallingWebServer\platform_scripts\cmd"
call start.bat
pause
