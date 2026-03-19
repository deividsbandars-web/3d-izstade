@echo off
title Warpala Pixel Streaming Launcher
color 0A

echo ================================================
echo   WARPALA CITY - PIXEL STREAMING LAUNCHER
echo ================================================
echo.

echo [1/2] Startejam WarpalaUE5 ar Pixel Streaming (savienojas ar Docker)...
start "" "C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe" "C:\3d\WarpalaUE5\WarpalaUE5.uproject" -game -map=/Game/Warpala/Maps/WarpalaCity_Main -ResX=1280 -ResY=720 -AudioMixer -PixelStreamingURL="ws://127.0.0.1:8888" -PixelStreamingPort=8888 -RenderOffScreen -dx12 -unattended

echo [2/2] Gaidam lai UE5 palaistas (20 sekundes)...
timeout /t 20 /nobreak > nul

echo.
echo ================================================
echo   VISS DARBOJAS!
echo   Signaling Server : Docker Container (8888)
echo   Tava majaslapa   : savienojies ar ws://127.0.0.1:8888
echo ================================================
echo.
echo Lai apturetu - aizver so logu un apturi Docker konteinerus.
pause
