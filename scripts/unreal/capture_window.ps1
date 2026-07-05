param(
  [Parameter(Mandatory = $true)]
  [int]$ProcessId,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$signature = @"
using System;
using System.Runtime.InteropServices;

public static class Win32Capture {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, int nFlags);
}
"@

Add-Type -TypeDefinition $signature | Out-Null

$proc = Get-Process -Id $ProcessId -ErrorAction Stop
$deadline = (Get-Date).AddSeconds(40)
while ($proc.MainWindowHandle -eq 0 -and (Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 500
  $proc.Refresh()
}

if ($proc.MainWindowHandle -eq 0) {
  throw "Process $ProcessId has no main window handle."
}

[Win32Capture]::ShowWindow($proc.MainWindowHandle, 3) | Out-Null
[Win32Capture]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 1200

$rect = New-Object Win32Capture+RECT
[Win32Capture]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null

$width = [Math]::Max(1, $rect.Right - $rect.Left)
$height = [Math]::Max(1, $rect.Bottom - $rect.Top)

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$hdc = $graphics.GetHdc()
$printed = $false
try {
  $printed = [Win32Capture]::PrintWindow($proc.MainWindowHandle, $hdc, 0)
} finally {
  $graphics.ReleaseHdc($hdc)
}
if (-not $printed) {
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
}

$parent = Split-Path -Parent $OutputPath
if (-not (Test-Path $parent)) {
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
}

$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Captured window to $OutputPath"
