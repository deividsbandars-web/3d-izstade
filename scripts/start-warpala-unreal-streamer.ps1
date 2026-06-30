param(
  [string]$UnrealEngineDir = $env:WARPALA_UE_DIR,
  [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
  [string]$MapPath = '/Game/Warpala/Maps/Booth_Showroom_Main',
  [ValidateSet('Game', 'EditorViewport')]
  [string]$LaunchMode = 'Game',
  [string]$StreamerId = 'booth-sponsor-concierge',
  [string]$SignalingUrl = 'ws://127.0.0.1:8888',
  [switch]$RenderOffscreen,
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
$projectRoot = Split-Path -Parent $resolvedProjectPath

if ($MapPath) {
  if ($MapPath -notmatch '^/Game/') {
    Stop-WithMessage "MapPath must be a /Game package path, for example /Game/Warpala/Maps/Booth_Showroom_Main."
  }

  $mapRelativePath = ($MapPath -replace '^/Game/', 'Content/') + '.umap'
  $mapDiskPath = Join-Path $projectRoot ($mapRelativePath -replace '/', '\')
  if (-not (Test-Path -LiteralPath $mapDiskPath)) {
    Stop-WithMessage "Unreal map not found for MapPath $MapPath at $mapDiskPath"
  }
}

Write-Step "resolved paths"
Write-Host "Engine:  $resolvedEngineDir"
Write-Host "Project: $resolvedProjectPath"
Write-Host "Map:     $MapPath"
Write-Host "Mode:    $LaunchMode"
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
Write-Host "Opening map: $MapPath"

if ($LaunchMode -eq 'Game') {
  $unrealArgs = @(
    $resolvedProjectPath,
    $MapPath,
    '-game',
    '-log',
    '-AudioMixer',
    "-PixelStreamingID=$StreamerId",
    "-PixelStreamingConnectionURL=$SignalingUrl",
    '-PixelStreamingAutoStartStream'
  )

  if ($RenderOffscreen) {
    $unrealArgs += '-RenderOffscreen'
  }

  & $unrealEditor @unrealArgs
} else {
  & $unrealEditor $resolvedProjectPath $MapPath `
    -log `
    -PixelStreamingID="$StreamerId" `
    -PixelStreamingConnectionURL="$SignalingUrl" `
    -PixelStreamingAutoStartStream `
    -PixelStreamingEditorUseRemoteSignallingServer `
    -PixelStreamingEditorStartOnLaunch `
    -PixelStreamingEditorSource=LevelEditorViewport
}

if ($LASTEXITCODE -ne 0) {
  Stop-WithMessage "Unreal Editor exited with code $LASTEXITCODE."
}
