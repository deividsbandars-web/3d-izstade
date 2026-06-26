param(
  [ValidateSet('local', 'staging')]
  [string]$Stack = 'local',
  [string]$EnvFile = '.env.docker',
  [switch]$NoBuild,
  [switch]$SkipSmokeCheck,
  [switch]$Strict,
  [switch]$ValidateOnly,
  [switch]$ShowLogs
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[expo-stack] $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
  param([string]$Message)
  Write-Host "[expo-stack] ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Read-DotEnvFile {
  param([string]$Path)

  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf('=')
    if ($separatorIndex -le 0) {
      continue
    }

    $key = $trimmed.Substring(0, $separatorIndex).Trim()
    $value = $trimmed.Substring($separatorIndex + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $values[$key] = $value
  }

  return $values
}

function Test-PlaceholderValue {
  param([string]$Value)

  if (-not $Value) {
    return $true
  }

  return $Value -match 'replace-with|change-me|your-|nomaini|example|dummy'
}

function Require-Commands {
  foreach ($command in @('docker', 'npm.cmd')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
      Stop-WithMessage "Required command not found: $command"
    }
  }
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 90
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 3
    }
  } while ((Get-Date) -lt $deadline)

  return $false
}

function Invoke-Checked {
  param([string[]]$CommandArgs)
  & $CommandArgs[0] @($CommandArgs | Select-Object -Skip 1)
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Command failed: $($CommandArgs -join ' ')"
  }
}

$composeFile = if ($Stack -eq 'staging') { 'docker-compose.staging.yml' } else { 'docker-compose.yml' }
$statusUrl = if ($Stack -eq 'staging') {
  'http://127.0.0.1:3001/api/pixel-streaming/status'
} else {
  'http://127.0.0.1:3000/api/pixel-streaming/status'
}
$backendHealthUrl = if ($Stack -eq 'staging') { 'http://127.0.0.1:3001/health' } else { 'http://127.0.0.1:3000/health' }
$frontendUrl = 'http://127.0.0.1:8080/expo-3d?salesDemo=1'
$streamUrl = 'http://127.0.0.1:8080/expo/booth/sponsor-concierge/stream'

$requiredEnv = if ($Stack -eq 'staging') {
  @(
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'UE5_SECRET_KEY',
    'TURN_SERVER_URLS',
    'TURN_USERNAME',
    'TURN_PASSWORD'
  )
} else {
  @(
    'VITE_PUBLIC_API_BASE_URL',
    'VITE_SIGNALING_SERVER_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'UE5_SECRET_KEY',
    'TURN_SERVER_URLS',
    'TURN_USERNAME',
    'TURN_PASSWORD',
    'TURN_PUBLIC_IP'
  )
}

Write-Step "checking prerequisites"
Require-Commands

if (-not (Test-Path -LiteralPath $composeFile)) {
  Stop-WithMessage "Compose file missing: $composeFile"
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  Stop-WithMessage "Env file missing: $EnvFile. Copy .env.docker.example to $EnvFile and fill real values."
}

$envValues = Read-DotEnvFile -Path $EnvFile
$missing = @()
$placeholders = @()

foreach ($key in $requiredEnv) {
  $value = [string]$envValues[$key]
  if (-not $value) {
    $missing += $key
  } elseif (Test-PlaceholderValue -Value $value) {
    $placeholders += $key
  }
}

if ($missing.Count -gt 0) {
  Stop-WithMessage "Missing required env keys in ${EnvFile}: $($missing -join ', ')"
}

if ($placeholders.Count -gt 0) {
  Stop-WithMessage "Placeholder env values must be replaced in ${EnvFile}: $($placeholders -join ', ')"
}

if ($Stack -eq 'local') {
  $apiBaseUrl = [string]$envValues['VITE_PUBLIC_API_BASE_URL']
  $signalingUrl = [string]$envValues['VITE_SIGNALING_SERVER_URL']
  if ($apiBaseUrl -match '30sek24\.com') {
    Stop-WithMessage "Local Docker frontend must not use hosted API URL ($apiBaseUrl). Set VITE_PUBLIC_API_BASE_URL=http://127.0.0.1:8080 so /api proxies to the local backend."
  }
  if ($signalingUrl -match '30sek24\.com') {
    Stop-WithMessage "Local Docker frontend must not use hosted signaling URL ($signalingUrl). Set VITE_SIGNALING_SERVER_URL=ws://127.0.0.1:8080/ws/ so /ws proxies to the local signaling server."
  }
}

Write-Step "validating docker compose config"
Invoke-Checked @('docker', 'compose', '-f', $composeFile, '--env-file', $EnvFile, 'config', '--quiet')

if ($ValidateOnly) {
  Write-Host "[expo-stack] Validation only requested; stack was not started." -ForegroundColor Green
  exit 0
}

Write-Step "starting $Stack stack"
$upArgs = @('docker', 'compose', '-f', $composeFile, '--env-file', $EnvFile, 'up', '-d')
if (-not $NoBuild) {
  $upArgs += '--build'
}
Invoke-Checked $upArgs

Write-Step "waiting for backend health"
if (-not (Wait-HttpOk -Url $backendHealthUrl -TimeoutSeconds 120)) {
  docker compose -f $composeFile --env-file $EnvFile ps
  Stop-WithMessage "Backend health endpoint did not become ready: $backendHealthUrl"
}

if ($Stack -eq 'local') {
  Write-Step "waiting for frontend"
  if (-not (Wait-HttpOk -Url 'http://127.0.0.1:8080' -TimeoutSeconds 90)) {
    docker compose -f $composeFile --env-file $EnvFile ps
    Stop-WithMessage "Frontend did not become ready: http://127.0.0.1:8080"
  }
}

if (-not $SkipSmokeCheck) {
  Write-Step "running legacy runtime smoke check"
  $previousStatusUrl = $env:PIXEL_STREAMING_STATUS_URL
  $env:PIXEL_STREAMING_STATUS_URL = $statusUrl
  try {
    $mode = if ($Strict) { 'strict' } else { 'baseline' }
    Invoke-Checked @('npm.cmd', 'run', 'check:expo:legacy-runtime', '--', '--mode', $mode)
  } finally {
    $env:PIXEL_STREAMING_STATUS_URL = $previousStatusUrl
  }
}

Write-Step "stack ready"
Write-Host "Backend health: $backendHealthUrl"
Write-Host "Legacy status:  $statusUrl"
if ($Stack -eq 'local') {
  Write-Host "Web3D sales:    $frontendUrl"
  Write-Host "Booth stream:   $streamUrl"
}
Write-Host ""
Write-Host "Legacy streamer is not launched by Docker."
Write-Host "Expected booth streamer id: booth-sponsor-concierge"
Write-Host "Expected signaling streamer port: ws://127.0.0.1:8888"
Write-Host "If no legacy streamer is connected, /stream will correctly show the legacy fallback state."

if ($ShowLogs) {
  Write-Step "following logs"
  docker compose -f $composeFile --env-file $EnvFile logs -f --tail=120
}
