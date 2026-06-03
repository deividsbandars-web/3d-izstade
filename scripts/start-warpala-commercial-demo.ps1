param(
  [string]$EnvFile = '.env.docker',
  [string]$UnrealEngineDir = $env:WARPALA_UE_DIR,
  [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
  [string]$MapPath = '/Game/Warpala/Maps/Booth_Showroom_Main',
  [ValidateSet('Game', 'EditorViewport')]
  [string]$LaunchMode = 'Game',
  [string]$StreamerId = 'booth-sponsor-concierge',
  [string]$SignalingUrl = 'ws://127.0.0.1:8888',
  [switch]$RenderOffscreen,
  [switch]$NoDockerBuild,
  [switch]$GenerateProjectFiles,
  [switch]$BuildUnreal,
  [switch]$SkipSmokeCheck,
  [switch]$SkipStreamerWait,
  [int]$PostLaunchStabilitySeconds = 20,
  [switch]$Strict,
  [switch]$ValidateOnly,
  [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[warpala-commercial] $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
  param([string]$Message)
  Write-Host "[warpala-commercial] ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Quote-ProcessArg {
  param([string]$Value)
  if ($Value -match '[\s"]') {
    return '"' + ($Value -replace '"', '\"') + '"'
  }
  return $Value
}

function Invoke-CheckedScript {
  param([string[]]$CommandArgs)
  & $CommandArgs[0] @($CommandArgs | Select-Object -Skip 1)
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Command failed: $($CommandArgs -join ' ')"
  }
}

function Wait-StreamerReady {
  param(
    [string]$StatusUrl,
    [string]$ExpectedStreamerId,
    [int]$TimeoutSeconds = 180
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $status = Invoke-RestMethod -Uri $StatusUrl -TimeoutSec 5
      $activeStreamerId = [string]$status.session.activeStreamerId
      $selectionPolicy = [string]$status.session.selectionPolicy
      $warnings = @($status.warnings)
      $usesFallback = $warnings -contains 'FALLBACK_SHARED_STREAM'
      if (
        $status.streamer -eq 'streamer_available' -and
        $activeStreamerId -eq $ExpectedStreamerId -and
        $selectionPolicy -eq 'booth_preferred' -and
        -not $usesFallback
      ) {
        Write-Host "[warpala-commercial] Streamer ready: $activeStreamerId" -ForegroundColor Green
        return $true
      }
      Write-Host "[warpala-commercial] Waiting for booth-preferred streamer... signaling=$($status.signaling), streamer=$($status.streamer), active=$($activeStreamerId -replace '^$', 'none'), policy=$selectionPolicy, warnings=$($warnings -join ',')"
    } catch {
      Write-Host "[warpala-commercial] Waiting for status endpoint..."
    }
    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)

  return $false
}

$stackScript = Join-Path $PSScriptRoot 'start-expo-pixel-streaming-stack.ps1'
$unrealScript = Join-Path $PSScriptRoot 'start-warpala-unreal-streamer.ps1'
$healthScript = Join-Path $PSScriptRoot 'check-warpala-commercial-demo.ps1'
$salesDemoUrl = 'http://127.0.0.1:8080/expo-3d?salesDemo=1'
$boothStreamUrl = 'http://127.0.0.1:8080/expo/booth/sponsor-concierge/stream'
$streamStatusUrl = 'http://127.0.0.1:3000/api/pixel-streaming/status?boothId=booth-sponsor-concierge&slug=sponsor-concierge&streamingLevel=Level_Booth_booth-sponsor-concierge'

if (-not (Test-Path -LiteralPath $stackScript)) {
  Stop-WithMessage "Missing stack script: $stackScript"
}

if (-not (Test-Path -LiteralPath $unrealScript)) {
  Stop-WithMessage "Missing Unreal streamer script: $unrealScript"
}

if (-not (Test-Path -LiteralPath $healthScript)) {
  Stop-WithMessage "Missing commercial health script: $healthScript"
}

Write-Step "validating launchers"
Invoke-CheckedScript @('powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $stackScript, '-EnvFile', $EnvFile, '-ValidateOnly')

$unrealValidateArgs = @(
  'powershell',
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $unrealScript,
  '-ProjectPath',
  $ProjectPath,
  '-MapPath',
  $MapPath,
  '-LaunchMode',
  $LaunchMode,
  '-StreamerId',
  $StreamerId,
  '-SignalingUrl',
  $SignalingUrl,
  '-ValidateOnly'
)
if ($UnrealEngineDir) {
  $unrealValidateArgs += @('-UnrealEngineDir', $UnrealEngineDir)
}
if ($RenderOffscreen) {
  $unrealValidateArgs += '-RenderOffscreen'
}
Invoke-CheckedScript $unrealValidateArgs

if ($ValidateOnly) {
  Write-Host "[warpala-commercial] Validation only requested; nothing was started." -ForegroundColor Green
  exit 0
}

Write-Step "starting Docker gateway stack"
$stackArgs = @(
  'powershell',
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $stackScript,
  '-EnvFile',
  $EnvFile
)
if ($NoDockerBuild) {
  $stackArgs += '-NoBuild'
}
if ($SkipSmokeCheck) {
  $stackArgs += '-SkipSmokeCheck'
}
if ($Strict) {
  $stackArgs += '-Strict'
}
Invoke-CheckedScript $stackArgs

Write-Step "launching Unreal streamer in a separate PowerShell window"
$unrealArgs = @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $unrealScript,
  '-ProjectPath',
  $ProjectPath,
  '-MapPath',
  $MapPath,
  '-LaunchMode',
  $LaunchMode,
  '-StreamerId',
  $StreamerId,
  '-SignalingUrl',
  $SignalingUrl
)
if ($UnrealEngineDir) {
  $unrealArgs += @('-UnrealEngineDir', $UnrealEngineDir)
}
if ($RenderOffscreen) {
  $unrealArgs += '-RenderOffscreen'
}
if ($GenerateProjectFiles) {
  $unrealArgs += '-GenerateProjectFiles'
}
if ($BuildUnreal) {
  $unrealArgs += '-Build'
}

$argumentList = ($unrealArgs | ForEach-Object { Quote-ProcessArg $_ }) -join ' '
Start-Process -FilePath 'powershell.exe' -ArgumentList $argumentList -WorkingDirectory $repoRoot

if (-not $SkipStreamerWait) {
  Write-Step "waiting for Unreal streamer registration"
  if (-not (Wait-StreamerReady -StatusUrl $streamStatusUrl -ExpectedStreamerId $StreamerId -TimeoutSeconds 180)) {
    Write-Host "[warpala-commercial] Gateway is running, but the Unreal streamer was not detected yet." -ForegroundColor Yellow
    Write-Host "[warpala-commercial] Check the Unreal window logs and keep it open. The stream page may show degraded until the streamer connects." -ForegroundColor Yellow
  }

  if ($PostLaunchStabilitySeconds -gt 0) {
    Write-Step "checking commercial stream stability"
    Invoke-CheckedScript @(
      'powershell',
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      $healthScript,
      '-EnvFile',
      $EnvFile,
      '-ProjectPath',
      $ProjectPath,
      '-MapPath',
      $MapPath,
      '-LaunchMode',
      $LaunchMode,
      '-StreamerId',
      $StreamerId,
      '-StatusUrl',
      $streamStatusUrl,
      '-StreamUrl',
      $boothStreamUrl,
      '-SalesDemoUrl',
      $salesDemoUrl,
      '-StabilitySeconds',
      ([string]$PostLaunchStabilitySeconds)
    )
  }
}

if ($OpenBrowser) {
  Write-Step "opening demo URLs"
  Start-Process $salesDemoUrl
  Start-Process $boothStreamUrl
}

Write-Step "commercial demo launch complete"
Write-Host "Sales demo:    $salesDemoUrl"
Write-Host "Booth stream:  $boothStreamUrl"
Write-Host "Status check:  $streamStatusUrl"
Write-Host "Streamer id:   $StreamerId"
Write-Host "Signaling URL: $SignalingUrl"
Write-Host ""
Write-Host "Health check:"
Write-Host "  npm run check:expo:commercial"
Write-Host ""
Write-Host "Fast rerun after images/project are built:"
Write-Host "  npm run start:expo:commercial -- -NoDockerBuild -SkipSmokeCheck -SkipStreamerWait -OpenBrowser"
