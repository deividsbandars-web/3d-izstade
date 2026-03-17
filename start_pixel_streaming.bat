@echo off
echo Startējam WarpalaUE5 Pixel Streaming (Low Memory mode)...
start "" "C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe" "C:\3d\WarpalaUE5\WarpalaUE5.uproject" -game -ResX=1280 -ResY=720 -AudioMixer -PixelStreamingIP=127.0.0.1 -PixelStreamingPort=8888 -RenderOffScreen
echo Spēle tiek startēta fonā!

echo Startējam Signaling Server...
cd /d "C:\Program Files\Epic Games\UE_5.7\Engine\Plugins\Media\PixelStreaming\Resources\WebServers\SignallingWebServer\platform_scripts\cmd"
call start.bat
pause
