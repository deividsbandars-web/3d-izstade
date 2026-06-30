param(
  [int]$Port = 9230,
  [string]$ProfileDir = 'review_artifacts/tmp/cdp-review-chrome-profile',
  [switch]$Visible
)

$ErrorActionPreference = 'Stop'

function Test-CdpPort {
  param([int]$Port)

  try {
    $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json" -TimeoutSec 3
    return @($targets).Count -gt 0
  } catch {
    return $false
  }
}

if (Test-CdpPort -Port $Port) {
  Write-Output "CDP already available at http://127.0.0.1:$Port/json"
  exit 0
}

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) }

$chromePath = $chromeCandidates | Select-Object -First 1
if (-not $chromePath) {
  throw 'Google Chrome was not found in the standard Windows install paths.'
}

$resolvedProfileDir = Join-Path (Get-Location) $ProfileDir
New-Item -ItemType Directory -Force -Path $resolvedProfileDir | Out-Null

$args = @(
  "--remote-debugging-port=$Port",
  "--user-data-dir=$resolvedProfileDir",
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-gpu',
  '--disable-sync',
  '--no-default-browser-check',
  '--no-first-run',
  'about:blank'
)

if (-not $Visible) {
  $args = @('--headless=new') + $args
}

Start-Process -FilePath $chromePath -ArgumentList $args -WindowStyle Hidden | Out-Null

for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
  Start-Sleep -Milliseconds 500
  if (Test-CdpPort -Port $Port) {
    Write-Output "CDP ready at http://127.0.0.1:$Port/json"
    Write-Output "Chrome profile: $resolvedProfileDir"
    exit 0
  }
}

throw "Chrome started, but CDP did not become ready on port $Port."
