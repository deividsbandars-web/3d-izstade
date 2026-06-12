$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC'
$uproject = Join-Path $projectRoot 'LT52A_ModularHome_Unreal_POC.uproject'
$editorExe = 'C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe'
$captureScript = 'C:\3d\scripts\unreal\capture_lt52a_review.py'
$requestPath = 'C:\3d\tmp\lt52a_capture_request.json'
$latestDir = Join-Path $projectRoot 'Saved\ReviewCaptures\LT52A\latest'
$timestampDir = Join-Path (Join-Path $projectRoot 'Saved\ReviewCaptures\LT52A') (Get-Date -Format 'yyyyMMdd_HHmmss')

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

$manifest = @()
$status = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  captures = @()
  errors = @()
}

foreach ($entry in $plan) {
  $request = [ordered]@{
    fileName = $entry.file
    cameraLabel = $entry.camera
    clearLatest = $false
  } | ConvertTo-Json
  Set-Content -Path $requestPath -Value $request -Encoding UTF8

  & $editorExe $uproject -NoSplash "-ExecutePythonScript=$captureScript" | Out-Null

  $target = Join-Path $latestDir $entry.file
  $captured = Test-Path $target
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
}

Remove-Item -Path $requestPath -Force -ErrorAction SilentlyContinue

$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $latestDir 'manifest.json') -Encoding UTF8
$status | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $latestDir 'capture_status.json') -Encoding UTF8

$capturedCount = ($manifest | Where-Object { $_.captured }).Count
Write-Output "Captured $capturedCount / $($plan.Count) LT52A review images."
