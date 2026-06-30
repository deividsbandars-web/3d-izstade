param(
  [string]$EnvFile = '.env.docker',
  [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
  [string]$MapPath = '/Game/Warpala/Maps/Booth_Showroom_Main',
  [ValidateSet('Game', 'EditorViewport')]
  [string]$LaunchMode = 'Game',
  [string]$StreamerId = 'booth-sponsor-concierge',
  [string]$StatusUrl = 'http://127.0.0.1:3000/api/pixel-streaming/status?boothId=booth-sponsor-concierge&slug=sponsor-concierge&streamingLevel=Level_Booth_booth-sponsor-concierge',
  [string]$StreamUrl = 'http://127.0.0.1:8080/expo/booth/sponsor-concierge/stream',
  [string]$SalesDemoUrl = 'http://127.0.0.1:8080/expo-3d?salesDemo=1',
  [int]$StabilitySeconds = 0,
  [switch]$Json,
  [switch]$WarnOnly
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Message,
    [object]$Details = $null
  )

  $checks.Add([pscustomobject]@{
    name = $Name
    status = $Status
    message = $Message
    details = $Details
  }) | Out-Null
}

function Resolve-MapDiskPath {
  param(
    [string]$ResolvedProjectPath,
    [string]$RequestedMapPath
  )

  if ($RequestedMapPath -notmatch '^/Game/') {
    return $null
  }

  $projectRoot = Split-Path -Parent $ResolvedProjectPath
  $mapRelativePath = ($RequestedMapPath -replace '^/Game/', 'Content/') + '.umap'
  return Join-Path $projectRoot ($mapRelativePath -replace '/', '\')
}

function Invoke-JsonEndpoint {
  param([string]$Url)

  return Invoke-RestMethod -Uri $Url -TimeoutSec 10
}

function Invoke-HttpStatus {
  param([string]$Url)

  $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10
  return [int]$response.StatusCode
}

function Get-MatchingUnrealProcesses {
  param([string]$ExpectedStreamerId)

  return @(Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -eq 'UnrealEditor.exe' -and
      $_.CommandLine -like "*PixelStreamingID=$ExpectedStreamerId*"
    })
}

function Test-CurrentState {
  param([string]$Phase)

  if (-not (Test-Path -LiteralPath $ProjectPath)) {
    Add-Check "$Phase.unrealProject" 'fail' "Unreal project not found: $ProjectPath"
  } else {
    $resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
    Add-Check "$Phase.unrealProject" 'pass' "Unreal project exists." @{ path = $resolvedProjectPath }

    $mapDiskPath = Resolve-MapDiskPath -ResolvedProjectPath $resolvedProjectPath -RequestedMapPath $MapPath
    if (-not $mapDiskPath) {
      Add-Check "$Phase.unrealMap" 'fail' "MapPath must be a /Game package path." @{ mapPath = $MapPath }
    } elseif (Test-Path -LiteralPath $mapDiskPath) {
      $mapItem = Get-Item -LiteralPath $mapDiskPath
      Add-Check "$Phase.unrealMap" 'pass' "Unreal map exists." @{
        mapPath = $MapPath
        diskPath = $mapDiskPath
        bytes = $mapItem.Length
        lastWriteTime = $mapItem.LastWriteTime.ToString('s')
      }
    } else {
      Add-Check "$Phase.unrealMap" 'fail' "Unreal map file is missing." @{
        mapPath = $MapPath
        diskPath = $mapDiskPath
      }
    }
  }

  $unrealProcesses = Get-MatchingUnrealProcesses -ExpectedStreamerId $StreamerId
  if ($unrealProcesses.Count -eq 0) {
    Add-Check "$Phase.unrealProcess" 'fail' "No UnrealEditor streamer process found for $StreamerId."
  } elseif ($unrealProcesses.Count -gt 1) {
    Add-Check "$Phase.unrealProcess" 'fail' "Multiple UnrealEditor streamer processes found for $StreamerId." @{
      count = $unrealProcesses.Count
      processIds = @($unrealProcesses | ForEach-Object { $_.ProcessId })
    }
  } else {
    $commandLine = [string]$unrealProcesses[0].CommandLine
    $hasMap = $commandLine -like "*$MapPath*"
    $hasGameMode = $commandLine -like '* -game *' -or $commandLine -like '* -game'
    $hasEditorMode = $commandLine -like '*PixelStreamingEditorSource=LevelEditorViewport*'
    $modeMatches =
      ($LaunchMode -eq 'Game' -and $hasGameMode) -or
      ($LaunchMode -eq 'EditorViewport' -and $hasEditorMode)

    if ($hasMap -and $modeMatches) {
      Add-Check "$Phase.unrealProcess" 'pass' "Unreal streamer process is running with expected map and mode." @{
        processId = $unrealProcesses[0].ProcessId
        launchMode = $LaunchMode
        commandLine = $commandLine
      }
    } else {
      Add-Check "$Phase.unrealProcess" 'fail' "Unreal streamer process is running, but map or launch mode does not match." @{
        processId = $unrealProcesses[0].ProcessId
        expectedMap = $MapPath
        expectedMode = $LaunchMode
        commandLine = $commandLine
      }
    }
  }

  try {
    $streamStatus = Invoke-JsonEndpoint -Url $StatusUrl
    $activeStreamerId = [string]$streamStatus.session.activeStreamerId
    $warnings = @($streamStatus.warnings)
    if (
      $streamStatus.signaling -eq 'signaling_up' -and
      $streamStatus.streamer -eq 'streamer_available' -and
      $streamStatus.readiness -eq 'session_ready' -and
      $activeStreamerId -eq $StreamerId
    ) {
      Add-Check "$Phase.pixelStatus" 'pass' "Pixel Streaming status is ready." @{
        signaling = $streamStatus.signaling
        streamer = $streamStatus.streamer
        readiness = $streamStatus.readiness
        activeStreamerId = $activeStreamerId
        warnings = $warnings
      }
    } else {
      Add-Check "$Phase.pixelStatus" 'fail' "Pixel Streaming status is not ready." @{
        signaling = $streamStatus.signaling
        streamer = $streamStatus.streamer
        readiness = $streamStatus.readiness
        activeStreamerId = $activeStreamerId
        warnings = $warnings
      }
    }
  } catch {
    Add-Check "$Phase.pixelStatus" 'fail' "Pixel Streaming status endpoint failed: $($_.Exception.Message)"
  }

  try {
    $streamHttpStatus = Invoke-HttpStatus -Url $StreamUrl
    if ($streamHttpStatus -eq 200) {
      Add-Check "$Phase.streamPage" 'pass' "Booth stream page responds with HTTP 200." @{ url = $StreamUrl }
    } else {
      Add-Check "$Phase.streamPage" 'fail' "Booth stream page returned HTTP $streamHttpStatus." @{ url = $StreamUrl }
    }
  } catch {
    Add-Check "$Phase.streamPage" 'fail' "Booth stream page request failed: $($_.Exception.Message)" @{ url = $StreamUrl }
  }

  try {
    $salesHttpStatus = Invoke-HttpStatus -Url $SalesDemoUrl
    if ($salesHttpStatus -eq 200) {
      Add-Check "$Phase.salesDemoPage" 'pass' "Sales demo page responds with HTTP 200." @{ url = $SalesDemoUrl }
    } else {
      Add-Check "$Phase.salesDemoPage" 'fail' "Sales demo page returned HTTP $salesHttpStatus." @{ url = $SalesDemoUrl }
    }
  } catch {
    Add-Check "$Phase.salesDemoPage" 'fail' "Sales demo page request failed: $($_.Exception.Message)" @{ url = $SalesDemoUrl }
  }
}

Test-CurrentState -Phase 'initial'

if ($StabilitySeconds -gt 0) {
  Start-Sleep -Seconds $StabilitySeconds
  Test-CurrentState -Phase "after${StabilitySeconds}s"
}

$failures = @($checks | Where-Object { $_.status -eq 'fail' })
$overallStatus = if ($failures.Count -eq 0) { 'pass' } else { 'fail' }
$summary = New-Object 'System.Collections.Specialized.OrderedDictionary'
$summary['checkedAt'] = (Get-Date).ToString('s')
$summary['status'] = $overallStatus
$summary['failureCount'] = $failures.Count
$summary['envFile'] = $EnvFile
$summary['streamerId'] = $StreamerId
$summary['mapPath'] = $MapPath
$summary['launchMode'] = $LaunchMode
$summary['checks'] = @($checks.ToArray())

if ($Json) {
  $summary | ConvertTo-Json -Depth 8
} else {
  Write-Host ""
  Write-Host "[warpala-health] commercial demo health check" -ForegroundColor Cyan
  foreach ($check in $checks) {
    $color = if ($check.status -eq 'pass') { 'Green' } else { 'Red' }
    Write-Host "[$($check.status.ToUpperInvariant())] $($check.name): $($check.message)" -ForegroundColor $color
  }
  Write-Host "[warpala-health] status: $($summary['status']), failures: $($summary['failureCount'])"
}

if ($failures.Count -gt 0 -and -not $WarnOnly) {
  exit 1
}
