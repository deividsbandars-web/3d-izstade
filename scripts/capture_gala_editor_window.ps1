param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,
    [Parameter(Mandatory = $true)]
    [string]$ViewName,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectFile = Join-Path $ProjectRoot 'GALA_PresentationUE5_Clean.uproject'
$savedRoot = Join-Path $ProjectRoot 'Saved\GALA_Delivery'
$requestPath = Join-Path $savedRoot 'startup_request.json'
$statusPath = Join-Path $savedRoot 'startup_last_open.json'
$editorPath = 'C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe'

New-Item -ItemType Directory -Path $savedRoot -Force | Out-Null
New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($OutputPath)) -Force | Out-Null

$requestPayload = @{
    mode = 'open_only'
    view = $ViewName
} | ConvertTo-Json -Compress
Set-Content -LiteralPath $requestPath -Value $requestPayload -Encoding UTF8

$startTime = Get-Date
$process = Start-Process -FilePath $editorPath -ArgumentList @($projectFile) -PassThru

try {
    $deadline = (Get-Date).AddMinutes(3)
    do {
        Start-Sleep -Milliseconds 500
        $process.Refresh()
        if ($process.HasExited) {
            throw "Unreal editor exited before capture for view '$ViewName'."
        }
        $statusReady = $false
        if (Test-Path $statusPath) {
            $statusFile = Get-Item -LiteralPath $statusPath
            if ($statusFile.LastWriteTime -gt $startTime) {
                $status = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
                if ($status.level_path -eq '/Game/WoodHouse_GALA/Levels/LVL_WoodHouse_GALA_Complete' -and $status.default_view -eq $ViewName) {
                    $statusReady = $true
                }
            }
        }
    } until ($process.MainWindowHandle -ne 0 -and $statusReady -or (Get-Date) -gt $deadline)

    if ($process.MainWindowHandle -eq 0) {
        throw "Unreal editor window did not become available for view '$ViewName'."
    }
    if (-not $statusReady) {
        throw "Startup status was not updated for view '$ViewName'."
    }

    Add-Type -AssemblyName System.Drawing
    Add-Type @"
using System;
using System.Drawing;
using System.Runtime.InteropServices;

public static class GalaWindowCapture {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }

    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT point);
}
"@

    Start-Sleep -Seconds 2
    $handle = [System.IntPtr]$process.MainWindowHandle
    $rect = New-Object GalaWindowCapture+RECT
    $ok = [GalaWindowCapture]::GetClientRect($handle, [ref]$rect)
    if (-not $ok) {
        throw "Could not read Unreal editor client rect for view '$ViewName'."
    }

    $topLeft = New-Object GalaWindowCapture+POINT
    $topLeft.X = $rect.Left
    $topLeft.Y = $rect.Top
    [void][GalaWindowCapture]::ClientToScreen($handle, [ref]$topLeft)

    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    if ($width -le 0 -or $height -le 0) {
        throw "Unreal editor client area was empty for view '$ViewName'."
    }

    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CopyFromScreen($topLeft.X, $topLeft.Y, 0, 0, $bitmap.Size)
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}
finally {
    if (-not $process.HasExited) {
        $null = $process.CloseMainWindow()
        $quitDeadline = (Get-Date).AddSeconds(30)
        do {
            Start-Sleep -Milliseconds 500
            $process.Refresh()
        } until ($process.HasExited -or (Get-Date) -gt $quitDeadline)
        if (-not $process.HasExited) {
            Stop-Process -Id $process.Id -Force
        }
    }
}
