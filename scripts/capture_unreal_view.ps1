param(
  [Parameter(Mandatory=$true)][string]$OutputPath
)

Add-Type @'
using System;
using System.Runtime.InteropServices;
public class GalaCaptureWin32 {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@

Get-Process |
  Where-Object { $_.MainWindowTitle -and $_.ProcessName -ne 'UnrealEditor' } |
  ForEach-Object { [GalaCaptureWin32]::ShowWindowAsync($_.MainWindowHandle, 6) | Out-Null }

Get-Process powershell,pwsh,WindowsTerminal -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } |
  ForEach-Object { [GalaCaptureWin32]::ShowWindowAsync($_.MainWindowHandle, 6) | Out-Null }

Start-Sleep -Seconds 1
$unreal = Get-Process UnrealEditor -ErrorAction SilentlyContinue | Select-Object -First 1
if ($unreal) {
  [GalaCaptureWin32]::ShowWindowAsync($unreal.MainWindowHandle, 3) | Out-Null
  Start-Sleep -Milliseconds 500
  [GalaCaptureWin32]::SetForegroundWindow($unreal.MainWindowHandle) | Out-Null
}

Start-Sleep -Seconds 2
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
