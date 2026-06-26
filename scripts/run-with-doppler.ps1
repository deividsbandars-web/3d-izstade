$ErrorActionPreference = 'Stop'

function Write-Help {
  @'
Run a command through Doppler with a Windows-safe resolver.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 <doppler args...>

Resolution order:
  1. DOPPLER_BIN if it points to an existing file
  2. `Get-Command doppler`
  3. Known WinGet Doppler install path, if present

Examples:
  powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs
  powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- npm.cmd run lint

Safety:
  - no secret values are printed
  - arguments are passed through exactly
  - the helper only resolves the Doppler executable
'@ | Write-Host
}

function Resolve-DopplerPath {
  $candidates = @()

  if ($env:DOPPLER_BIN) {
    $candidates += $env:DOPPLER_BIN
  }

  $command = $null
  try {
    $command = Get-Command doppler -ErrorAction Stop
  } catch {
    $command = $null
  }

  if ($command -and $command.Path) {
    $candidates += $command.Path
  } elseif ($command -and $command.Source) {
    $candidates += $command.Source
  }

  $wingetPath = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Doppler.doppler_Microsoft.Winget.Source_8wekyb3d8bbwe\doppler.exe'
  $candidates += $wingetPath

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }

    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  throw @"
Unable to resolve Doppler.

Expected one of:
  - DOPPLER_BIN set to a valid doppler.exe path
  - doppler available on PATH
  - WinGet install at:
    $wingetPath

Tip:
  Use this helper only for local QA runs. It does not print secrets.
"@
}

$dopplerArgs = @($args)

if ($dopplerArgs.Count -gt 0 -and ($dopplerArgs[0] -in @('--help', '-h', '/?', 'help'))) {
  Write-Help
  exit 0
}

$dopplerPath = Resolve-DopplerPath
& $dopplerPath @dopplerArgs
exit $LASTEXITCODE
