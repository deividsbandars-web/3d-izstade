param(
  [string]$UnrealEngineDir = $env:WARPALA_UE_DIR,
  [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
  [string]$MapPath = '/Game/Warpala/Maps/Booth_Showroom_Main',
  [string]$PythonScript = 'C:\3d\WarpalaUE5\Scripts\PolishBoothShowroom.py',
  [switch]$AllowWhileUnrealRunning,
  [switch]$AutoQuit,
  [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[warpala-showroom-polish] $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
  param([string]$Message)
  Write-Host "[warpala-showroom-polish] ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Resolve-UnrealEngineDir {
  param([string]$RequestedPath)

  $candidates = @()
  if ($RequestedPath) {
    $candidates += $RequestedPath
  }

  $candidates += @(
    'C:\Program Files\Epic Games\UE_5.7',
    'D:\UE_5.7',
    'D:\Epic Games\UE_5.7'
  )

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }

    $editorPath = Join-Path $candidate 'Engine\Binaries\Win64\UnrealEditor.exe'
    if (Test-Path -LiteralPath $editorPath) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  Stop-WithMessage "Unreal Engine 5.7 was not found. Set WARPALA_UE_DIR or pass -UnrealEngineDir."
}

if (-not (Test-Path -LiteralPath $ProjectPath)) {
  Stop-WithMessage "Unreal project not found: $ProjectPath"
}

if (-not (Test-Path -LiteralPath $PythonScript)) {
  Stop-WithMessage "Showroom polish Python script not found: $PythonScript"
}

$resolvedEngineDir = Resolve-UnrealEngineDir -RequestedPath $UnrealEngineDir
$resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$resolvedPythonScript = (Resolve-Path -LiteralPath $PythonScript).Path
$unrealEditor = Join-Path $resolvedEngineDir 'Engine\Binaries\Win64\UnrealEditor.exe'
$projectRoot = Split-Path -Parent $resolvedProjectPath

if ($MapPath -notmatch '^/Game/') {
  Stop-WithMessage "MapPath must be a /Game package path, for example /Game/Warpala/Maps/Booth_Showroom_Main."
}

$mapRelativePath = ($MapPath -replace '^/Game/', 'Content/') + '.umap'
$mapDiskPath = Join-Path $projectRoot ($mapRelativePath -replace '/', '\')
if (-not (Test-Path -LiteralPath $mapDiskPath)) {
  Stop-WithMessage "Unreal map not found for MapPath $MapPath at $mapDiskPath"
}

$runningEditors = @(Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq 'UnrealEditor.exe' -and
    $_.CommandLine -like "*$resolvedProjectPath*"
  })

if ($runningEditors.Count -gt 0 -and $ValidateOnly) {
  Write-Host "[warpala-showroom-polish] Warning: Unreal is currently running for this project; close it before applying polish." -ForegroundColor Yellow
} elseif ($runningEditors.Count -gt 0 -and -not $AllowWhileUnrealRunning) {
  Stop-WithMessage "Unreal is already running for this project. Close it first, or pass -AllowWhileUnrealRunning if you intentionally accept the risk."
}

Write-Step "resolved paths"
Write-Host "Engine:  $resolvedEngineDir"
Write-Host "Project: $resolvedProjectPath"
Write-Host "Map:     $MapPath"
Write-Host "Script:  $resolvedPythonScript"

if ($ValidateOnly) {
  Write-Host "[warpala-showroom-polish] Validation only requested; Unreal was not launched." -ForegroundColor Green
  exit 0
}

Write-Step "launching Unreal showroom polish"
if ($AutoQuit) {
  $env:WARPALA_SHOWROOM_POLISH_QUIT = '1'
}

& $unrealEditor $resolvedProjectPath $MapPath `
  -log `
  -nop4 `
  -nosplash `
  "-ExecutePythonScript=$resolvedPythonScript"

if ($LASTEXITCODE -ne 0) {
  Stop-WithMessage "Unreal Editor exited with code $LASTEXITCODE."
}

Write-Host "[warpala-showroom-polish] Done." -ForegroundColor Green
