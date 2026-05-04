param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'http://localhost:5173/expo-3d?operator=1',
  [string]$OutputRoot = 'C:\3d\tmp-full-city-clean-pass',
  [switch]$FixSafe,
  [int]$SmallScreenshotBytes = 120000
)

$ErrorActionPreference = 'Stop'

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath $($Arguments -join ' ')"
  }
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function New-Issue {
  param(
    [string]$Severity,
    [string]$Code,
    [string]$Message
  )

  return [pscustomobject]@{
    code = $Code
    message = $Message
    severity = $Severity
  }
}

function Add-UniqueIssue {
  param(
    [System.Collections.Generic.List[object]]$Target,
    [pscustomobject]$Issue
  )

  $key = "$($Issue.severity)|$($Issue.code)|$($Issue.message)"
  if (-not ($Target | Where-Object { "$($_.severity)|$($_.code)|$($_.message)" -eq $key })) {
    [void]$Target.Add($Issue)
  }
}

function Resolve-IssueSeverityFromStatus {
  param([string]$Status)
  switch ($Status) {
    'critical' { return 'critical' }
    'error' { return 'critical' }
    'warn' { return 'high' }
    'warning' { return 'high' }
    'ok' { return 'low' }
    default { return 'medium' }
  }
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDir = Join-Path $OutputRoot $timestamp
$reviewPath = Join-Path $runDir 'zone-review.json'
$screensDir = Join-Path $runDir 'screens'
$reportPath = Join-Path $runDir 'full-city-clean-report.json'
$summaryPath = Join-Path $runDir 'summary.txt'

Ensure-Dir -Path $runDir
Ensure-Dir -Path $screensDir

$reviewScript = Join-Path $PSScriptRoot 'cdp_review_expo_world.ps1'
$captureScript = Join-Path $PSScriptRoot 'cdp_capture_expo_zone_screenshots.ps1'

try {
  [void](Invoke-RestMethod -Uri $BrowserJsonUrl -TimeoutSec 3)
} catch {
  throw "CDP endpoint is unavailable at $BrowserJsonUrl. Start Chrome with remote debugging before running full_city_clean_pass.ps1."
}

Write-Host "[full-city-clean-pass] running operator review..."
Invoke-Checked -FilePath 'powershell' -Arguments @(
  '-ExecutionPolicy', 'Bypass',
  '-File', $reviewScript,
  '-BrowserJsonUrl', $BrowserJsonUrl,
  '-SiteUrl', $SiteUrl,
  '-OutputPath', $reviewPath
)

$reviewRaw = Get-Content -LiteralPath $reviewPath -Raw | ConvertFrom-Json
if (-not $reviewRaw -or $reviewRaw.Count -eq 0) {
  throw "Review output is empty: $reviewPath"
}

$zoneIds = @($reviewRaw | ForEach-Object { $_.zoneId } | Where-Object { $_ } | Select-Object -Unique)
if ($zoneIds.Count -eq 0) {
  throw 'No zone IDs found in review output.'
}

Write-Host "[full-city-clean-pass] capturing zone screenshots for $($zoneIds.Count) zones..."
Invoke-Checked -FilePath 'powershell' -Arguments @(
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "& '$captureScript' -BrowserJsonUrl '$BrowserJsonUrl' -SiteUrl '$SiteUrl' -OutputDir '$screensDir' -Zones @('$($zoneIds -join "','")')"
)

$byZone = @{}
$allIssues = New-Object 'System.Collections.Generic.List[object]'

foreach ($zone in $reviewRaw) {
  $zoneId = [string]$zone.zoneId
  $zoneIssues = New-Object 'System.Collections.Generic.List[object]'

  $statusSeverity = Resolve-IssueSeverityFromStatus -Status ([string]$zone.status)
  if ($zone.status -and [string]$zone.status -ne 'ok') {
    Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity $statusSeverity -Code 'zone-status' -Message "Zone status is '$($zone.status)'.")
  }

  foreach ($warning in @($zone.warnings)) {
    if ($warning) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'review-warning' -Message ([string]$warning))
    }
  }

  foreach ($defect in @($zone.visualDefects)) {
    if ($defect) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'visual-defect' -Message ([string]$defect))
    }
  }

  foreach ($obs in @($zone.observations)) {
    if ($obs -and [string]$obs -match 'Extra visible layer|forbidden|missing|overlap|seam|floating') {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'observation' -Message ([string]$obs))
    }
  }

  $diag = $zone.diagnosticsSummary
  if ($diag) {
    if ([int]$diag.screenOverlapCount -gt 0) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'screen-overlap' -Message "screenOverlapCount=$($diag.screenOverlapCount)")
    }
    if ([int]$diag.screenBoothProximityCount -gt 0) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screen-booth-proximity' -Message "screenBoothProximityCount=$($diag.screenBoothProximityCount)")
    }
    if ([int]$diag.screenBoundsCount -gt 0) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screen-bounds' -Message "screenBoundsCount=$($diag.screenBoundsCount)")
    }
    if ([int]$diag.screenOrientationCount -gt 0) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screen-orientation' -Message "screenOrientationCount=$($diag.screenOrientationCount)")
    }
    if ([int]$diag.boothFrontalityCount -gt 0) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'booth-frontality' -Message "boothFrontalityCount=$($diag.boothFrontalityCount)")
    }
  }

  $screenshotPath = Join-Path $screensDir "$zoneId.png"
  $screenshotExists = Test-Path -LiteralPath $screenshotPath
  $screenshotBytes = if ($screenshotExists) { (Get-Item -LiteralPath $screenshotPath).Length } else { 0 }
  if (-not $screenshotExists) {
    Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'critical' -Code 'screenshot-missing' -Message 'Screenshot not captured for zone.')
  } elseif ($screenshotBytes -lt $SmallScreenshotBytes) {
    Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screenshot-small' -Message "Screenshot file is small ($screenshotBytes bytes), inspect possible blank/obstructed view.")
  }

  $severityOrder = @{ critical = 5; high = 4; medium = 3; low = 2; ok = 1 }
  $worst = 'ok'
  foreach ($issue in $zoneIssues) {
    $issueRank = if ($severityOrder.ContainsKey([string]$issue.severity)) { $severityOrder[[string]$issue.severity] } else { 0 }
    $worstRank = if ($severityOrder.ContainsKey([string]$worst)) { $severityOrder[[string]$worst] } else { 0 }
    if ($issueRank -gt $worstRank) {
      $worst = $issue.severity
    }
  }

  $fixRoutes = @($zone.fixRoutes | ForEach-Object {
    [pscustomobject]@{
      issue = $_.issue
      reason = $_.reason
      safeEditSeam = $_.safeEditSeam
      sourceFile = $_.sourceFile
      target = $_.target
    }
  })

  $entry = @{
    id = $zoneId
    label = $zone.label
    status = $zone.status
    severity = $worst
    issueCount = $zoneIssues.Count
    issues = $zoneIssues.ToArray()
    diagnosticsSummary = $diag
    screenshot = @{
      exists = $screenshotExists
      path = $screenshotPath
      bytes = $screenshotBytes
    }
    fixRoutes = $fixRoutes
  }

  $byZone[$zoneId] = [pscustomobject]$entry
  foreach ($i in $zoneIssues) {
    [void]$allIssues.Add([pscustomobject]@{
      zoneId = $zoneId
      severity = $i.severity
      code = $i.code
      message = $i.message
    })
  }
}

$zonesOrdered = @($byZone.Values | Sort-Object @{ Expression = {
  switch ($_.severity) {
    'critical' { 0 }
    'high' { 1 }
    'medium' { 2 }
    'low' { 3 }
    default { 4 }
  }
}}, @{ Expression = 'issueCount'; Descending = $true }, 'id')

$severityCounts = [ordered]@{
  critical = (@($zonesOrdered | Where-Object { $_.severity -eq 'critical' })).Count
  high = (@($zonesOrdered | Where-Object { $_.severity -eq 'high' })).Count
  medium = (@($zonesOrdered | Where-Object { $_.severity -eq 'medium' })).Count
  low = (@($zonesOrdered | Where-Object { $_.severity -eq 'low' })).Count
  ok = (@($zonesOrdered | Where-Object { $_.severity -eq 'ok' })).Count
}

$fixSafeActions = @()
if ($FixSafe.IsPresent) {
  # Safe mode in v1 only marks actionable routes; code edits stay explicit/approved.
  $fixSafeActions = @(
    $zonesOrdered |
      ForEach-Object { $_.fixRoutes } |
      Where-Object { $_ -and $_.safeEditSeam -and $_.target } |
      Select-Object -Unique safeEditSeam, sourceFile, issue, target, reason
  )
}

$report = [pscustomobject]@{
  meta = [pscustomobject]@{
    generatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    runDir = $runDir
    siteUrl = $SiteUrl
    zoneCount = $zoneIds.Count
    fixSafeMode = [bool]$FixSafe.IsPresent
    smallScreenshotBytes = $SmallScreenshotBytes
  }
  summary = [pscustomobject]@{
    severityCounts = $severityCounts
    totalIssues = $allIssues.Count
    topZones = @($zonesOrdered | Select-Object -First 12 id, label, severity, issueCount, status)
  }
  zones = $zonesOrdered
  fixSafeActions = $fixSafeActions
}

$report | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $reportPath -Encoding UTF8

$summaryLines = @(
  "full-city-clean-pass",
  "runDir: $runDir",
  "siteUrl: $SiteUrl",
  "zones: $($zoneIds.Count)",
  "issues: $($allIssues.Count)",
  "severity: critical=$($severityCounts.critical), high=$($severityCounts.high), medium=$($severityCounts.medium), low=$($severityCounts.low), ok=$($severityCounts.ok)",
  "",
  "top zones:"
)
$summaryLines += @($zonesOrdered | Select-Object -First 12 | ForEach-Object { "- $($_.id) [$($_.severity)] issues=$($_.issueCount) status=$($_.status)" })
if ($FixSafe.IsPresent) {
  $summaryLines += ""
  $summaryLines += "fix-safe actions:"
  $summaryLines += @($fixSafeActions | ForEach-Object { "- $($_.issue) target=$($_.target) seam=$($_.safeEditSeam)" })
}
$summaryLines | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Output ($report | ConvertTo-Json -Depth 20)
