$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC'
$uproject = Join-Path $projectRoot 'LT52A_ModularHome_Unreal_POC.uproject'
$editorExe = 'C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe'
$previewScript = 'C:\3d\scripts\unreal\preview_lt52a_camera.py'
$windowCaptureScript = 'C:\3d\scripts\unreal\capture_window.ps1'
$requestPath = 'C:\3d\tmp\lt52a_preview_request.json'
$statusPath = 'C:\3d\tmp\lt52a_preview_status.json'
$captureRoot = Join-Path $projectRoot 'Saved\ReviewCaptures\LT52A'
$latestDir = Join-Path $captureRoot 'latest_os'
$timestampDir = Join-Path $captureRoot ("os_" + (Get-Date -Format 'yyyyMMdd_HHmmss'))

$plan = @(
  @{ file = '01-exterior.png'; camera = 'LT52A_Camera_Exterior' },
  @{ file = '02-overview.png'; camera = 'LT52A_Camera_Overview' },
  @{ file = '03-terrace.png'; camera = 'LT52A_Camera_Terrace' },
  @{ file = '04-living.png'; camera = 'LT52A_Camera_Living' },
  @{ file = '05-bedroom.png'; camera = 'LT52A_Camera_Bedroom' },
  @{ file = '06-bathroom.png'; camera = 'LT52A_Camera_Bathroom' }
)

New-Item -ItemType Directory -Force -Path $latestDir | Out-Null
New-Item -ItemType Directory -Force -Path $timestampDir | Out-Null
Get-ChildItem -Path $latestDir -File -ErrorAction SilentlyContinue | Remove-Item -Force
Remove-Item -Path $statusPath -Force -ErrorAction SilentlyContinue

$manifest = @()
$status = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  mode = 'os-window-capture'
  captures = @()
  errors = @()
}

foreach ($entry in $plan) {
  Remove-Item -Path $statusPath -Force -ErrorAction SilentlyContinue

  $request = [ordered]@{
    cameraLabel = $entry.camera
    holdSeconds = 25
  } | ConvertTo-Json
  Set-Content -Path $requestPath -Value $request -Encoding UTF8

  $launchMarker = Get-Date
  Start-Process -FilePath $editorExe -ArgumentList @(
    $uproject,
    '-NoSplash',
    "-ExecutePythonScript=$previewScript"
  ) | Out-Null

  Start-Sleep -Seconds 30

  $target = Join-Path $latestDir $entry.file
  $captured = $false
  $editorProc = $null
  $editorProc = Get-Process UnrealEditor -ErrorAction SilentlyContinue |
    Where-Object { $_.StartTime -ge $launchMarker.AddSeconds(-5) } |
    Sort-Object StartTime -Descending |
    Select-Object -First 1

  if ($editorProc) {
    try {
      & $windowCaptureScript -ProcessId $editorProc.Id -OutputPath $target | Out-Null
      $captured = Test-Path $target
    } catch {
      $status.errors += "Capture failed for $($entry.camera): $($_.Exception.Message)"
    }
  } else {
    $status.errors += "Editor process not found for $($entry.camera)"
  }

  if ($captured) {
    Copy-Item -Path $target -Destination (Join-Path $timestampDir $entry.file) -Force
  }

  $manifest += [ordered]@{
    file = $entry.file
    camera = $entry.camera
    path = $target
    captured = $captured
  }
  $status.captures += [ordered]@{
    camera = $entry.camera
    captured = $captured
  }

  $deadlineExit = (Get-Date).AddSeconds(25)
  do {
    $remaining = Get-Process UnrealEditor -ErrorAction SilentlyContinue |
      Where-Object { $_.StartTime -ge $launchMarker.AddSeconds(-2) }
    if (-not $remaining) { break }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadlineExit)

  $remaining = Get-Process UnrealEditor -ErrorAction SilentlyContinue |
    Where-Object { $_.StartTime -ge $launchMarker.AddSeconds(-2) }
  if ($remaining) {
    $remaining | Stop-Process -Force -ErrorAction SilentlyContinue
  }
}

Remove-Item -Path $requestPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $statusPath -Force -ErrorAction SilentlyContinue

$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $latestDir 'manifest.json') -Encoding UTF8
$status | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $latestDir 'capture_status.json') -Encoding UTF8

$capturedCount = ($manifest | Where-Object { $_.captured }).Count
Write-Output "Captured $capturedCount / $($plan.Count) LT52A OS review images."
