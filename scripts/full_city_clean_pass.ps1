param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'http://localhost:5173/expo-3d?operator=1',
  [string]$OutputRoot = 'C:\3d\tmp-full-city-clean-pass',
  [string]$VercelProtectionBypass = '',
  [switch]$FixSafe,
  [switch]$EmitJson,
  [int]$SmallScreenshotBytes = 120000,
  [double]$LowDetailBrightnessStdDev = 12.0,
  [int]$LowDetailColorBuckets = 12
)

$ErrorActionPreference = 'Stop'

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [switch]$SuppressOutput
  )

  if ($SuppressOutput.IsPresent) {
    & $FilePath @Arguments | Out-Null
  } else {
    & $FilePath @Arguments
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath. Arguments omitted to avoid leaking protected deployment tokens."
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

function Get-ScreenshotQualityStats {
  param(
    [string]$Path,
    [int]$SampleColumns = 40,
    [int]$SampleRows = 24
  )

  $bitmap = $null
  try {
    if (-not $script:ScreenshotQualityDrawingLoaded) {
      Add-Type -AssemblyName System.Drawing
      $script:ScreenshotQualityDrawingLoaded = $true
    }

    $bitmap = [System.Drawing.Bitmap]::new($Path)
    $width = [int]$bitmap.Width
    $height = [int]$bitmap.Height
    $stepX = [Math]::Max(1, [int][Math]::Floor($width / [double]$SampleColumns))
    $stepY = [Math]::Max(1, [int][Math]::Floor($height / [double]$SampleRows))
    $startX = [Math]::Min($width - 1, [int][Math]::Floor($stepX / 2))
    $startY = [Math]::Min($height - 1, [int][Math]::Floor($stepY / 2))

    $sum = 0.0
    $sumSquares = 0.0
    $sampleCount = 0
    $colorBuckets = @{}

    for ($y = $startY; $y -lt $height; $y += $stepY) {
      for ($x = $startX; $x -lt $width; $x += $stepX) {
        $pixel = $bitmap.GetPixel($x, $y)
        $brightness = ((0.2126 * $pixel.R) + (0.7152 * $pixel.G) + (0.0722 * $pixel.B)) / 255.0
        $sum += $brightness
        $sumSquares += ($brightness * $brightness)
        $sampleCount += 1

        $bucketKey = "$([int][Math]::Floor($pixel.R / 32))-$([int][Math]::Floor($pixel.G / 32))-$([int][Math]::Floor($pixel.B / 32))"
        $colorBuckets[$bucketKey] = $true
      }
    }

    if ($sampleCount -eq 0) {
      throw "No pixels sampled from screenshot."
    }

    $average = $sum / $sampleCount
    $variance = [Math]::Max(0.0, ($sumSquares / $sampleCount) - ($average * $average))

    return [pscustomobject]@{
      width = $width
      height = $height
      sampleCount = $sampleCount
      brightnessAverage = [Math]::Round($average * 100.0, 2)
      brightnessStdDev = [Math]::Round([Math]::Sqrt($variance) * 100.0, 2)
      colorBucketCount = $colorBuckets.Count
      error = $null
    }
  } catch {
    return [pscustomobject]@{
      width = 0
      height = 0
      sampleCount = 0
      brightnessAverage = 0
      brightnessStdDev = 0
      colorBucketCount = 0
      error = $_.Exception.Message
    }
  } finally {
    if ($bitmap) {
      $bitmap.Dispose()
    }
  }
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDir = Join-Path $OutputRoot $timestamp
$reviewPath = Join-Path $runDir 'zone-review.json'
$screensDir = Join-Path $runDir 'screens'
$reportPath = Join-Path $runDir 'full-city-clean-report.json'
$registryAuditPath = Join-Path $runDir 'registry-structural-audit.json'
$visualAuditPath = Join-Path $runDir 'visual-clean-audit.json'
$visualAuditMarkdownPath = Join-Path $runDir 'visual-clean-audit.md'
$summaryPath = Join-Path $runDir 'summary.txt'

Ensure-Dir -Path $runDir
Ensure-Dir -Path $screensDir

$reviewScript = Join-Path $PSScriptRoot 'cdp_review_expo_world.ps1'
$captureScript = Join-Path $PSScriptRoot 'cdp_capture_expo_zone_screenshots.ps1'
$registryAuditScript = Join-Path $PSScriptRoot 'audit-expo-world-registry.mjs'
$visualAuditScript = Join-Path $PSScriptRoot 'audit-expo-visual-clean.mjs'

try {
  [void](Invoke-RestMethod -Uri $BrowserJsonUrl -TimeoutSec 3)
} catch {
  throw "CDP endpoint is unavailable at $BrowserJsonUrl. Start Chrome with remote debugging before running full_city_clean_pass.ps1."
}

Write-Host "[full-city-clean-pass] running operator review..."
$reviewArgs = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', $reviewScript,
  '-BrowserJsonUrl', $BrowserJsonUrl,
  '-SiteUrl', $SiteUrl,
  '-OutputPath', $reviewPath
)
if ($VercelProtectionBypass.Trim()) {
  $reviewArgs += @('-VercelProtectionBypass', $VercelProtectionBypass.Trim())
}
Invoke-Checked -FilePath 'powershell' -Arguments $reviewArgs -SuppressOutput

$reviewRaw = Get-Content -LiteralPath $reviewPath -Raw | ConvertFrom-Json
if (-not $reviewRaw -or $reviewRaw.Count -eq 0) {
  throw "Review output is empty: $reviewPath"
}

$zoneIds = @($reviewRaw | ForEach-Object { $_.zoneId } | Where-Object { $_ } | Select-Object -Unique)
if ($zoneIds.Count -eq 0) {
  throw 'No zone IDs found in review output.'
}

Write-Host "[full-city-clean-pass] capturing zone screenshots for $($zoneIds.Count) zones..."
$captureCommand = "& '$captureScript' -BrowserJsonUrl '$BrowserJsonUrl' -SiteUrl '$SiteUrl' -OutputDir '$screensDir' -Zones @('$($zoneIds -join "','")')"
if ($VercelProtectionBypass.Trim()) {
  $escapedBypass = $VercelProtectionBypass.Trim().Replace("'", "''")
  $captureCommand = "& '$captureScript' -BrowserJsonUrl '$BrowserJsonUrl' -SiteUrl '$SiteUrl' -OutputDir '$screensDir' -VercelProtectionBypass '$escapedBypass' -Zones @('$($zoneIds -join "','")')"
}
Invoke-Checked -FilePath 'powershell' -Arguments @(
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  $captureCommand
) -SuppressOutput

$screenshotMetadataByZone = @{}
$hashZones = @{}
foreach ($zoneId in $zoneIds) {
  $screenshotPath = Join-Path $screensDir "$zoneId.png"
  $screenshotExists = Test-Path -LiteralPath $screenshotPath
  $screenshotBytes = if ($screenshotExists) { (Get-Item -LiteralPath $screenshotPath).Length } else { 0 }
  $screenshotHash = $null
  $quality = $null

  if ($screenshotExists) {
    try {
      $screenshotHash = (Get-FileHash -LiteralPath $screenshotPath -Algorithm SHA256).Hash
    } catch {
      $screenshotHash = $null
    }

    $quality = Get-ScreenshotQualityStats -Path $screenshotPath

    if ($screenshotHash) {
      if (-not $hashZones.ContainsKey($screenshotHash)) {
        $hashZones[$screenshotHash] = New-Object 'System.Collections.Generic.List[string]'
      }
      [void]$hashZones[$screenshotHash].Add([string]$zoneId)
    }
  }

  $screenshotMetadataByZone[$zoneId] = [pscustomobject]@{
    exists = $screenshotExists
    path = $screenshotPath
    bytes = $screenshotBytes
    sha256 = $screenshotHash
    quality = $quality
  }
}

$duplicateScreenshotZonesByZone = @{}
foreach ($hash in $hashZones.Keys) {
  $duplicateZones = @($hashZones[$hash])
  if ($duplicateZones.Count -gt 1) {
    foreach ($duplicateZone in $duplicateZones) {
      $duplicateScreenshotZonesByZone[$duplicateZone] = $duplicateZones
    }
  }
}

$captureSnapshotByZone = @{}
foreach ($zoneId in $zoneIds) {
  $snapshotPath = Join-Path $screensDir "$zoneId.snapshot.json"
  if (Test-Path -LiteralPath $snapshotPath) {
    try {
      $captureSnapshotByZone[$zoneId] = Get-Content -LiteralPath $snapshotPath -Raw | ConvertFrom-Json
    } catch {
      $captureSnapshotByZone[$zoneId] = [pscustomobject]@{
        operatorZoneValidation = [pscustomobject]@{
          status = 'warning'
          zoneId = $zoneId
        }
        snapshotReadError = $_.Exception.Message
      }
    }
  }
}

$registryAudit = $null
$registryAuditError = $null
$registryAuditSnapshotPath = $null
$preferredRegistryAuditZone = 'ground-seam-overhead'
$preferredRegistryAuditSnapshotPath = Join-Path $screensDir "$preferredRegistryAuditZone.snapshot.json"

if (Test-Path -LiteralPath $preferredRegistryAuditSnapshotPath) {
  $registryAuditSnapshotPath = $preferredRegistryAuditSnapshotPath
} else {
  foreach ($zoneId in $zoneIds) {
    $candidateSnapshotPath = Join-Path $screensDir "$zoneId.snapshot.json"
    if (Test-Path -LiteralPath $candidateSnapshotPath) {
      $registryAuditSnapshotPath = $candidateSnapshotPath
      break
    }
  }
}

if (-not (Test-Path -LiteralPath $registryAuditScript)) {
  $registryAuditError = "Registry audit script is missing: $registryAuditScript"
} elseif (-not $registryAuditSnapshotPath) {
  $registryAuditError = 'No captured snapshot is available for registry structural audit.'
} else {
  try {
    Write-Host "[full-city-clean-pass] running registry structural audit..."
    Invoke-Checked -FilePath 'node' -Arguments @(
      $registryAuditScript,
      $registryAuditSnapshotPath,
      '--out',
      $registryAuditPath
    ) -SuppressOutput
    $registryAudit = Get-Content -LiteralPath $registryAuditPath -Raw | ConvertFrom-Json
  } catch {
    $registryAuditError = $_.Exception.Message
  }
}

$visualAudit = $null
$visualAuditError = $null
$captureManifestPath = Join-Path $screensDir 'manifest.json'
if (-not (Test-Path -LiteralPath $visualAuditScript)) {
  $visualAuditError = "Visual audit script is missing: $visualAuditScript"
} elseif (-not (Test-Path -LiteralPath $captureManifestPath)) {
  $visualAuditError = "Capture manifest is missing: $captureManifestPath"
} else {
  try {
    Write-Host "[full-city-clean-pass] running visual clean audit..."
    Invoke-Checked -FilePath 'node' -Arguments @(
      $visualAuditScript,
      $runDir,
      '--out',
      $visualAuditPath,
      '--md',
      $visualAuditMarkdownPath
    ) -SuppressOutput
    $visualAudit = Get-Content -LiteralPath $visualAuditPath -Raw | ConvertFrom-Json
  } catch {
    $visualAuditError = $_.Exception.Message
  }
}

$visualFindingsByZone = @{}
if ($visualAudit -and $visualAudit.zones) {
  foreach ($visualZone in @($visualAudit.zones)) {
    $visualZoneId = [string]$visualZone.zoneId
    if ($visualZoneId) {
      $visualFindingsByZone[$visualZoneId] = @($visualZone.findings)
    }
  }
}

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

  $captureSnapshot = $captureSnapshotByZone[$zoneId]
  $liveValidation = if ($captureSnapshot) { $captureSnapshot.operatorZoneValidation } else { $null }
  if ($liveValidation) {
    $zoneStatusOk = ((-not $zone.status) -or ([string]$zone.status -eq 'ok'))
    $expectedVisibleLayers = @($zone.expectedVisibleLayers | ForEach-Object { [string]$_ } | Where-Object { $_ })
    if ($expectedVisibleLayers.Count -eq 0 -and $captureSnapshot.operatorZone) {
      $expectedVisibleLayers = @($captureSnapshot.operatorZone.expectedVisibleLayers | ForEach-Object { [string]$_ } | Where-Object { $_ })
    }
    $actualVisibleLayers = @($liveValidation.actualVisibleLayers | ForEach-Object { [string]$_ } | Where-Object { $_ })

    $liveHasExpectedLayer = $false
    foreach ($expectedLayer in $expectedVisibleLayers) {
      if ($expectedLayer -and ($actualVisibleLayers -contains $expectedLayer)) {
        $liveHasExpectedLayer = $true
        break
      }
    }

    $liveStatus = [string]$liveValidation.status
    if ($liveStatus -and $liveStatus -ne 'ok' -and -not $zoneStatusOk) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'live-snapshot-status' -Message "Live screenshot snapshot status is '$liveStatus'.")
    }

    foreach ($id in @($liveValidation.missingExpectedObjectIds)) {
      if ($id -and ((-not $zoneStatusOk) -or (-not $liveHasExpectedLayer))) {
        Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'live-missing-expected-object' -Message "Live snapshot missing expected object: $id")
      }
    }
    foreach ($id in @($liveValidation.unknownExpectedObjectIds)) {
      if ($id) {
        Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'live-unknown-expected-object' -Message "Live snapshot unknown expected object: $id")
      }
    }
    foreach ($layer in @($liveValidation.missingExpectedLayers)) {
      if ($layer) {
        Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'live-missing-expected-layer' -Message "Live snapshot missing expected layer: $layer")
      }
    }
    foreach ($id in @($liveValidation.forbiddenObjectIdsPresent)) {
      if ($id) {
        Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'live-forbidden-object' -Message "Live snapshot sees forbidden object: $id")
      }
    }
    foreach ($layer in @($liveValidation.forbiddenExpectedLayersPresent)) {
      if ($layer) {
        Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'live-forbidden-layer' -Message "Live snapshot sees forbidden layer: $layer")
      }
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

  $screenshotMeta = $screenshotMetadataByZone[$zoneId]
  $screenshotExists = if ($screenshotMeta) { [bool]$screenshotMeta.exists } else { $false }
  $screenshotBytes = if ($screenshotMeta) { [int64]$screenshotMeta.bytes } else { 0 }
  if (-not $screenshotExists) {
    Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'critical' -Code 'screenshot-missing' -Message 'Screenshot not captured for zone.')
  } else {
    $quality = $screenshotMeta.quality
    $hasUsableQuality = $false
    $isLowDetailScreenshot = $false
    if ($quality -and $quality.error) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screenshot-analysis-failed' -Message "Screenshot quality analysis failed: $($quality.error)")
    } elseif ($quality) {
      $brightnessStdDev = [double]$quality.brightnessStdDev
      $colorBucketCount = [int]$quality.colorBucketCount
      $hasUsableQuality = $true
      $isLowDetailScreenshot = $brightnessStdDev -lt $LowDetailBrightnessStdDev -and $colorBucketCount -lt $LowDetailColorBuckets
      if ($isLowDetailScreenshot) {
        Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screenshot-low-detail' -Message "Screenshot is low-detail/possibly blank: brightnessStdDev=$brightnessStdDev, colorBucketCount=$colorBucketCount.")
      }
    }

    if ($screenshotBytes -lt $SmallScreenshotBytes -and (-not $hasUsableQuality -or $isLowDetailScreenshot)) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'screenshot-small' -Message "Screenshot file is small and quality signal is weak/missing ($screenshotBytes bytes), inspect possible blank/obstructed view.")
    }
  }

  if ($screenshotExists -and $duplicateScreenshotZonesByZone.ContainsKey($zoneId)) {
    $sharedZones = @($duplicateScreenshotZonesByZone[$zoneId] | Where-Object { $_ -ne $zoneId })
    Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'screenshot-duplicate' -Message "Screenshot hash is shared with zones: $($sharedZones -join ', ').")
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

  $rawFixRoutes = @($zone.fixRoutes)
  if ($captureSnapshot -and $captureSnapshot.operatorZoneFixRoutes) {
    $rawFixRoutes += @($captureSnapshot.operatorZoneFixRoutes)
  }
  $fixRoutes = @($rawFixRoutes | ForEach-Object {
    [pscustomobject]@{
      issue = $_.issue
      reason = $_.reason
      safeEditSeam = $_.safeEditSeam
      sourceFile = $_.sourceFile
      target = $_.target
    }
  })
  $visualFindings = if ($visualFindingsByZone.ContainsKey($zoneId)) { @($visualFindingsByZone[$zoneId]) } else { @() }

  $entry = @{
    id = $zoneId
    label = $zone.label
    status = $zone.status
    severity = $worst
    issueCount = $zoneIssues.Count
    issues = $zoneIssues.ToArray()
    diagnosticsSummary = $diag
    liveSnapshotStatus = if ($liveValidation) { $liveValidation.status } else { $null }
    screenshot = $screenshotMeta
    fixRoutes = $fixRoutes
    visualCleanFindingCount = $visualFindings.Count
    visualCleanFindings = $visualFindings
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
    lowDetailBrightnessStdDev = $LowDetailBrightnessStdDev
    lowDetailColorBuckets = $LowDetailColorBuckets
  }
  summary = [pscustomobject]@{
    severityCounts = $severityCounts
    totalIssues = $allIssues.Count
    topZones = @($zonesOrdered | Select-Object -First 12 id, label, severity, issueCount, status)
  }
  registryStructuralAudit = [pscustomobject]@{
    path = if ($registryAudit) { $registryAuditPath } else { $null }
    snapshot = $registryAuditSnapshotPath
    registryEntryCount = if ($registryAudit) { $registryAudit.registryEntryCount } else { $null }
    summary = if ($registryAudit) { $registryAudit.summary } else { $null }
    error = $registryAuditError
  }
  visualCleanAudit = [pscustomobject]@{
    path = if ($visualAudit) { $visualAuditPath } else { $null }
    markdownPath = if ($visualAudit) { $visualAuditMarkdownPath } else { $null }
    summary = if ($visualAudit) { $visualAudit.summary } else { $null }
    error = $visualAuditError
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
  "registry structural audit:",
  $(if ($registryAudit) {
    "issues: $($registryAudit.summary.totalIssues), critical=$($registryAudit.summary.severity.critical), high=$($registryAudit.summary.severity.high), medium=$($registryAudit.summary.severity.medium), low=$($registryAudit.summary.severity.low), entries=$($registryAudit.registryEntryCount)"
  } else {
    "error: $registryAuditError"
  }),
  "reportPath: $registryAuditPath",
  "",
  "visual clean audit:",
  $(if ($visualAudit) {
    "findings: $($visualAudit.summary.totalFindings), high=$($visualAudit.summary.severity.high), medium=$($visualAudit.summary.severity.medium), low=$($visualAudit.summary.severity.low)"
  } else {
    "error: $visualAuditError"
  }),
  "reportPath: $visualAuditPath",
  "markdownPath: $visualAuditMarkdownPath",
  "",
  "top zones:"
)
$summaryLines += @($zonesOrdered | Select-Object -First 12 | ForEach-Object { "- $($_.id) [$($_.severity)] issues=$($_.issueCount) status=$($_.status)" })
if ($visualAudit -and $visualAudit.summary -and $visualAudit.summary.topZones) {
  $summaryLines += ""
  $summaryLines += "top visual zones:"
  $summaryLines += @($visualAudit.summary.topZones | Select-Object -First 12 | ForEach-Object { "- $($_.zoneId) findings=$($_.findingCount) codes=$(@($_.topCodes) -join ',')" })
}
if ($FixSafe.IsPresent) {
  $summaryLines += ""
  $summaryLines += "fix-safe actions:"
  $summaryLines += @($fixSafeActions | ForEach-Object { "- $($_.issue) target=$($_.target) seam=$($_.safeEditSeam)" })
}
$summaryLines | Set-Content -LiteralPath $summaryPath -Encoding UTF8

if ($EmitJson.IsPresent) {
  Write-Output ($report | ConvertTo-Json -Depth 20)
} else {
  Write-Output ($summaryLines -join [Environment]::NewLine)
  Write-Output "reportPath: $reportPath"
}
