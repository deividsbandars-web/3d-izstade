param(
  [string]$UnrealEngineDir = $env:WARPALA_UE_DIR,
  [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
  [string]$StreamerId = 'booth-sponsor-concierge',
  [string]$SignalingUrl = 'ws://127.0.0.1:8888',
  [switch]$GenerateProjectFiles,
  [switch]$Build,
  [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[warpala-unreal] $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
  param([string]$Message)
  Write-Host "[warpala-unreal] ERROR: $Message" -ForegroundColor Red
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
    $ubtPath = Join-Path $candidate 'Engine\Binaries\DotNET\UnrealBuildTool\UnrealBuildTool.exe'
    if ((Test-Path -LiteralPath $editorPath) -and (Test-Path -LiteralPath $ubtPath)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  Stop-WithMessage "Unreal Engine 5.7 was not found. Set WARPALA_UE_DIR or pass -UnrealEngineDir."
}

if (-not (Test-Path -LiteralPath $ProjectPath)) {
  Stop-WithMessage "Unreal project not found: $ProjectPath"
}

$resolvedEngineDir = Resolve-UnrealEngineDir -RequestedPath $UnrealEngineDir
$resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$unrealEditor = Join-Path $resolvedEngineDir 'Engine\Binaries\Win64\UnrealEditor.exe'
$unrealBuildTool = Join-Path $resolvedEngineDir 'Engine\Binaries\DotNET\UnrealBuildTool\UnrealBuildTool.exe'
$buildBat = Join-Path $resolvedEngineDir 'Engine\Build\BatchFiles\Build.bat'

Write-Step "resolved paths"
Write-Host "Engine:  $resolvedEngineDir"
Write-Host "Project: $resolvedProjectPath"
Write-Host "Streamer id: $StreamerId"
Write-Host "Signaling:   $SignalingUrl"

if ($ValidateOnly) {
  Write-Host "[warpala-unreal] Validation only requested; Unreal was not launched." -ForegroundColor Green
  exit 0
}

if ($GenerateProjectFiles) {
  Write-Step "generating Unreal project files"
  & $unrealBuildTool -projectfiles -project="$resolvedProjectPath" -game -rocket -progress
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Project file generation failed."
  }
}

if ($Build) {
  Write-Step "building WarpalaUE5Editor"
  & $buildBat WarpalaUE5Editor Win64 Development -Project="$resolvedProjectPath" -WaitMutex
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Unreal build failed."
  }
}

Write-Step "launching Unreal Editor streamer"
Write-Host "Docker signaling gateway should already be running on $SignalingUrl."
Write-Host "The web viewer expects streamer id: $StreamerId"

& $unrealEditor $resolvedProjectPath `
  -log `
  -PixelStreamingID="$StreamerId" `
  -PixelStreamingConnectionURL="$SignalingUrl" `
  -PixelStreamingAutoStartStream `
  -PixelStreamingEditorUseRemoteSignallingServer `
  -PixelStreamingEditorStartOnLaunch `
  -PixelStreamingEditorSource=LevelEditorViewport

if ($LASTEXITCODE -ne 0) {
  Stop-WithMessage "Unreal Editor exited with code $LASTEXITCODE."
}
