param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'http://localhost:5173/expo-3d?operator=1&expoData=review',
  [string]$OutputRoot = 'C:\3d\tmp-full-city-clean-pass',
  [string]$VercelProtectionBypass = '',
  [switch]$FixSafe,
  [switch]$EmitJson,
  [ValidateSet('', 'critical', 'high', 'medium', 'low')]
  [string]$FailOnIssueSeverity = 'high',
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

function Test-OperatorTargetHit {
  param(
    [object]$Snapshot,
    [string]$ObjectId
  )

  if (-not $Snapshot -or -not $ObjectId) {
    return $false
  }

  $escapedObjectId = [regex]::Escape($ObjectId)
  foreach ($sample in @($Snapshot.operatorHitSamples)) {
    if (-not $sample) {
      continue
    }

    $targetObjectId = [string]$sample.targetObjectId
    if ($targetObjectId -ne $ObjectId) {
      continue
    }

    $stackText = (@($sample.clickStack) -join '|')
    if ($stackText -match $escapedObjectId) {
      return $true
    }
  }

  return $false
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

function New-ContactSheet {
  param(
    [string]$ScreensDir,
    [string]$OutputPath,
    [int]$Columns = 4,
    [int]$ThumbWidth = 360,
    [int]$ThumbHeight = 203,
    [int]$LabelHeight = 24
  )

  $images = @(Get-ChildItem -LiteralPath $ScreensDir -Filter '*.png' | Sort-Object Name)
  if ($images.Count -eq 0) {
    return $null
  }

  if (-not $script:ScreenshotQualityDrawingLoaded) {
    Add-Type -AssemblyName System.Drawing
    $script:ScreenshotQualityDrawingLoaded = $true
  }

  $rows = [Math]::Ceiling($images.Count / [double]$Columns)
  $sheet = $null
  $graphics = $null
  $font = $null
  try {
    $sheet = [System.Drawing.Bitmap]::new($Columns * $ThumbWidth, [int]$rows * ($ThumbHeight + $LabelHeight))
    $graphics = [System.Drawing.Graphics]::FromImage($sheet)
    $graphics.Clear([System.Drawing.Color]::FromArgb(24, 24, 24))
    $font = [System.Drawing.Font]::new('Arial', 9)

    for ($index = 0; $index -lt $images.Count; $index += 1) {
      $image = $null
      try {
        $image = [System.Drawing.Image]::FromFile($images[$index].FullName)
        $x = ($index % $Columns) * $ThumbWidth
        $y = [Math]::Floor($index / [double]$Columns) * ($ThumbHeight + $LabelHeight)
        $graphics.DrawImage($image, $x, $y, $ThumbWidth, $ThumbHeight)
        $graphics.DrawString($images[$index].BaseName, $font, [System.Drawing.Brushes]::White, $x + 4, $y + $ThumbHeight + 4)
      } finally {
        if ($image) {
          $image.Dispose()
        }
      }
    }

    $sheet.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    return $OutputPath
  } finally {
    if ($font) {
      $font.Dispose()
    }
    if ($graphics) {
      $graphics.Dispose()
    }
    if ($sheet) {
      $sheet.Dispose()
    }
  }
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDir = Join-Path $OutputRoot $timestamp
$reviewPath = Join-Path $runDir 'zone-review.json'
$screensDir = Join-Path $runDir 'screens'
$reportPath = Join-Path $runDir 'full-city-clean-report.json'
$registryAuditPath = Join-Path $runDir 'registry-structural-audit.json'
$reviewCoverageAuditPath = Join-Path $runDir 'review-coverage-audit.json'
$visualAuditPath = Join-Path $runDir 'visual-clean-audit.json'
$visualAuditMarkdownPath = Join-Path $runDir 'visual-clean-audit.md'
$cityReviewAtlasPath = Join-Path $runDir 'city-review-atlas.json'
$cityReviewAtlasMarkdownPath = Join-Path $runDir 'city-review-atlas.md'
$contactSheetPath = Join-Path $runDir 'contact-sheet.png'
$summaryPath = Join-Path $runDir 'summary.txt'

Ensure-Dir -Path $runDir
Ensure-Dir -Path $screensDir

$reviewScript = Join-Path $PSScriptRoot 'cdp_review_expo_world.ps1'
$captureScript = Join-Path $PSScriptRoot 'cdp_capture_expo_zone_screenshots.ps1'
$registryAuditScript = Join-Path $PSScriptRoot 'audit-expo-world-registry.mjs'
$reviewCoverageAuditScript = Join-Path $PSScriptRoot 'audit-expo-review-coverage.mjs'
$visualAuditScript = Join-Path $PSScriptRoot 'audit-expo-visual-clean.mjs'
$cityReviewAtlasScript = Join-Path $PSScriptRoot 'build-expo-city-review-atlas.mjs'

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

$contactSheetGeneratedPath = $null
try {
  $contactSheetGeneratedPath = New-ContactSheet -ScreensDir $screensDir -OutputPath $contactSheetPath
} catch {
  Write-Warning "Contact sheet generation failed: $($_.Exception.Message)"
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

$mediaWallExpectedZonesByScreenId = @{}
foreach ($zoneId in $zoneIds) {
  $captureSnapshot = $captureSnapshotByZone[$zoneId]
  foreach ($expectedId in @($captureSnapshot.operatorZone.expectedKeyObjectIds)) {
    $screenId = [string]$expectedId
    if ($screenId -match '^screen-(marquee|array|spine)-') {
      if (-not $mediaWallExpectedZonesByScreenId.ContainsKey($screenId)) {
        $mediaWallExpectedZonesByScreenId[$screenId] = New-Object 'System.Collections.Generic.List[string]'
      }
      [void]$mediaWallExpectedZonesByScreenId[$screenId].Add([string]$zoneId)
    }
  }
}

$duplicateMediaWallTargetsByZone = @{}
foreach ($screenId in $mediaWallExpectedZonesByScreenId.Keys) {
  $screenZones = @($mediaWallExpectedZonesByScreenId[$screenId])
  if ($screenZones.Count -gt 1) {
    foreach ($screenZone in $screenZones) {
      if (-not $duplicateMediaWallTargetsByZone.ContainsKey($screenZone)) {
        $duplicateMediaWallTargetsByZone[$screenZone] = New-Object 'System.Collections.Generic.List[object]'
      }
      [void]$duplicateMediaWallTargetsByZone[$screenZone].Add([pscustomobject]@{
        screenId = $screenId
        zones = $screenZones
      })
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

$reviewCoverageAudit = $null
$reviewCoverageAuditError = $null
if (-not (Test-Path -LiteralPath $reviewCoverageAuditScript)) {
  $reviewCoverageAuditError = "Review coverage audit script is missing: $reviewCoverageAuditScript"
} else {
  try {
    Write-Host "[full-city-clean-pass] running review coverage audit..."
    Invoke-Checked -FilePath 'node' -Arguments @(
      $reviewCoverageAuditScript,
      $runDir,
      '--out',
      $reviewCoverageAuditPath
    ) -SuppressOutput
    $reviewCoverageAudit = Get-Content -LiteralPath $reviewCoverageAuditPath -Raw | ConvertFrom-Json
  } catch {
    $reviewCoverageAuditError = $_.Exception.Message
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
    $liveStatus = [string]$liveValidation.status
    $unverifiedMissingExpectedObjectIds = New-Object 'System.Collections.Generic.List[string]'
    foreach ($id in @($liveValidation.missingExpectedObjectIds)) {
      if ($id -and -not (Test-OperatorTargetHit -Snapshot $captureSnapshot -ObjectId ([string]$id))) {
        [void]$unverifiedMissingExpectedObjectIds.Add([string]$id)
      }
    }

    $hasUnverifiedLiveValidationIssue = (
      $unverifiedMissingExpectedObjectIds.Count -gt 0 `
      -or @($liveValidation.unknownExpectedObjectIds).Count -gt 0 `
      -or @($liveValidation.missingExpectedLayers).Count -gt 0 `
      -or @($liveValidation.forbiddenObjectIdsPresent).Count -gt 0 `
      -or @($liveValidation.forbiddenExpectedLayersPresent).Count -gt 0
    )

    if ($liveStatus -and $liveStatus -ne 'ok' -and $hasUnverifiedLiveValidationIssue) {
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'medium' -Code 'live-snapshot-status' -Message "Live screenshot snapshot status is '$liveStatus'.")
    }

    foreach ($id in @($unverifiedMissingExpectedObjectIds)) {
      if ($id) {
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

  if ($duplicateMediaWallTargetsByZone.ContainsKey($zoneId)) {
    $duplicateTargets = New-Object 'System.Collections.Generic.List[object]'
    foreach ($duplicateTargetItem in $duplicateMediaWallTargetsByZone[$zoneId]) {
      [void]$duplicateTargets.Add($duplicateTargetItem)
    }
    foreach ($duplicateTarget in $duplicateTargets) {
      $sharedZones = @($duplicateTarget.zones) | Where-Object { $_ -ne $zoneId }
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity 'high' -Code 'camera-duplicate-media-wall-target' -Message "Media wall target $($duplicateTarget.screenId) is reused by zones: $($sharedZones -join ', ').")
    }
  }

  $visualFindings = if ($visualFindingsByZone.ContainsKey($zoneId)) { @($visualFindingsByZone[$zoneId]) } else { @() }
  foreach ($finding in $visualFindings) {
    if ($finding -and $finding.code) {
      $findingSeverity = [string]$finding.severity
      if (-not $findingSeverity) {
        $findingSeverity = 'medium'
      }
      Add-UniqueIssue -Target $zoneIssues -Issue (New-Issue -Severity $findingSeverity -Code "visual-clean:$($finding.code)" -Message ([string]$finding.message))
    }
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

if ($registryAudit -and $registryAudit.issues) {
  foreach ($issue in @($registryAudit.issues)) {
    [void]$allIssues.Add([pscustomobject]@{
      zoneId = 'registry-structural-audit'
      severity = $issue.severity
      code = $issue.code
      message = $issue.message
    })
  }
}
if ($registryAuditError) {
  [void]$allIssues.Add([pscustomobject]@{
    zoneId = 'registry-structural-audit'
    severity = 'high'
    code = 'registry-structural-audit-error'
    message = $registryAuditError
  })
}
if ($reviewCoverageAudit -and $reviewCoverageAudit.issues) {
  foreach ($issue in @($reviewCoverageAudit.issues)) {
    [void]$allIssues.Add([pscustomobject]@{
      zoneId = 'review-coverage-audit'
      severity = $issue.severity
      code = $issue.code
      message = $issue.message
    })
  }
}

$cityReviewAtlas = $null
$cityReviewAtlasError = $null
if (-not (Test-Path -LiteralPath $cityReviewAtlasScript)) {
  $cityReviewAtlasError = "City review atlas script is missing: $cityReviewAtlasScript"
} else {
  try {
    Write-Host "[full-city-clean-pass] building city review atlas..."
    Invoke-Checked -FilePath 'node' -Arguments @(
      $cityReviewAtlasScript,
      $runDir,
      '--out',
      $cityReviewAtlasPath,
      '--md',
      $cityReviewAtlasMarkdownPath
    ) -SuppressOutput
    $cityReviewAtlas = Get-Content -LiteralPath $cityReviewAtlasPath -Raw | ConvertFrom-Json
  } catch {
    $cityReviewAtlasError = $_.Exception.Message
  }
}
if ($reviewCoverageAuditError) {
  [void]$allIssues.Add([pscustomobject]@{
    zoneId = 'review-coverage-audit'
    severity = 'high'
    code = 'review-coverage-audit-error'
    message = $reviewCoverageAuditError
  })
}
if ($visualAuditError) {
  [void]$allIssues.Add([pscustomobject]@{
    zoneId = 'visual-clean-audit'
    severity = 'high'
    code = 'visual-clean-audit-error'
    message = $visualAuditError
  })
}
if ($cityReviewAtlas -and $cityReviewAtlas.issues) {
  foreach ($issue in @($cityReviewAtlas.issues)) {
    [void]$allIssues.Add([pscustomobject]@{
      zoneId = 'city-review-atlas'
      severity = $issue.severity
      code = $issue.code
      message = $issue.message
    })
  }
}
if ($cityReviewAtlasError) {
  [void]$allIssues.Add([pscustomobject]@{
    zoneId = 'city-review-atlas'
    severity = 'high'
    code = 'city-review-atlas-error'
    message = $cityReviewAtlasError
  })
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

$issueSeverityCounts = [ordered]@{
  critical = (@($allIssues | Where-Object { $_.severity -eq 'critical' })).Count
  high = (@($allIssues | Where-Object { $_.severity -eq 'high' })).Count
  medium = (@($allIssues | Where-Object { $_.severity -eq 'medium' })).Count
  low = (@($allIssues | Where-Object { $_.severity -eq 'low' })).Count
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
    contactSheetPath = $contactSheetGeneratedPath
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
    issueSeverityCounts = $issueSeverityCounts
    totalIssues = $allIssues.Count
    topZones = @($zonesOrdered | Select-Object -First 12 id, label, severity, issueCount, status)
  }
  registryStructuralAudit = [pscustomobject]@{
    path = if ($registryAudit) { $registryAuditPath } else { $null }
    snapshot = $registryAuditSnapshotPath
    registryEntryCount = if ($registryAudit) { $registryAudit.registryEntryCount } else { $null }
    summary = if ($registryAudit) { $registryAudit.summary } else { $null }
    coverage = if ($registryAudit) { $registryAudit.coverage } else { $null }
    error = $registryAuditError
  }
  reviewCoverageAudit = [pscustomobject]@{
    path = if ($reviewCoverageAudit) { $reviewCoverageAuditPath } else { $null }
    summary = if ($reviewCoverageAudit) { $reviewCoverageAudit.summary } else { $null }
    coverage = if ($reviewCoverageAudit) { $reviewCoverageAudit.coverage } else { $null }
    error = $reviewCoverageAuditError
  }
  visualCleanAudit = [pscustomobject]@{
    path = if ($visualAudit) { $visualAuditPath } else { $null }
    markdownPath = if ($visualAudit) { $visualAuditMarkdownPath } else { $null }
    summary = if ($visualAudit) { $visualAudit.summary } else { $null }
    error = $visualAuditError
  }
  cityReviewAtlas = [pscustomobject]@{
    path = if ($cityReviewAtlas) { $cityReviewAtlasPath } else { $null }
    markdownPath = if ($cityReviewAtlas) { $cityReviewAtlasMarkdownPath } else { $null }
    summary = if ($cityReviewAtlas) { $cityReviewAtlas.summary } else { $null }
    error = $cityReviewAtlasError
  }
  zones = $zonesOrdered
  fixSafeActions = $fixSafeActions
}

$report | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $reportPath -Encoding UTF8

$summaryLines = @(
  "full-city-clean-pass",
  "runDir: $runDir",
  "siteUrl: $SiteUrl",
  "contactSheetPath: $contactSheetGeneratedPath",
  "zones: $($zoneIds.Count)",
  "issues: $($allIssues.Count)",
  "failOnIssueSeverity: $FailOnIssueSeverity",
  "severity: critical=$($severityCounts.critical), high=$($severityCounts.high), medium=$($severityCounts.medium), low=$($severityCounts.low), ok=$($severityCounts.ok)",
  "issue severity: critical=$($issueSeverityCounts.critical), high=$($issueSeverityCounts.high), medium=$($issueSeverityCounts.medium), low=$($issueSeverityCounts.low)",
  "",
  "registry structural audit:",
  $(if ($registryAudit) {
    "issues: $($registryAudit.summary.totalIssues), critical=$($registryAudit.summary.severity.critical), high=$($registryAudit.summary.severity.high), medium=$($registryAudit.summary.severity.medium), low=$($registryAudit.summary.severity.low), entries=$($registryAudit.registryEntryCount)"
  } else {
    "error: $registryAuditError"
  }),
  $(if ($registryAudit -and $registryAudit.coverage) {
    "coverage: screens=$($registryAudit.coverage.screens.surfaces), screenHostBindings=$($registryAudit.coverage.screens.hostBindings), ground=$($registryAudit.coverage.ground.total)"
  }),
  "reportPath: $registryAuditPath",
  "",
  "review coverage audit:",
  $(if ($reviewCoverageAudit) {
    "issues: $($reviewCoverageAudit.summary.totalIssues), critical=$($reviewCoverageAudit.summary.severity.critical), high=$($reviewCoverageAudit.summary.severity.high), medium=$($reviewCoverageAudit.summary.severity.medium), low=$($reviewCoverageAudit.summary.severity.low)"
  } else {
    "error: $reviewCoverageAuditError"
  }),
  $(if ($reviewCoverageAudit -and $reviewCoverageAudit.coverage) {
    "coverage: required=$($reviewCoverageAudit.coverage.required), covered=$($reviewCoverageAudit.coverage.covered), critical=$($reviewCoverageAudit.coverage.criticalCovered)/$($reviewCoverageAudit.coverage.criticalRequired), raycastEvidence=$($reviewCoverageAudit.coverage.criticalRaycastEvidence)/$($reviewCoverageAudit.coverage.raycastCriticalRequired), sampleHits=$($reviewCoverageAudit.coverage.criticalSampleHit)/$($reviewCoverageAudit.coverage.raycastCriticalRequired), targetHits=$($reviewCoverageAudit.coverage.criticalTargetHit)/$($reviewCoverageAudit.coverage.raycastCriticalRequired), samples=$($reviewCoverageAudit.coverage.sampleHitTotal), targetSamples=$($reviewCoverageAudit.coverage.targetSampleTotal), zones=$($reviewCoverageAudit.coverage.zones)"
  }),
  "reportPath: $reviewCoverageAuditPath",
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
  "city review atlas:",
  $(if ($cityReviewAtlas) {
    "issues: $($cityReviewAtlas.summary.issues.totalIssues), critical=$($cityReviewAtlas.summary.issues.severity.critical), high=$($cityReviewAtlas.summary.issues.severity.high), medium=$($cityReviewAtlas.summary.issues.severity.medium), low=$($cityReviewAtlas.summary.issues.severity.low)"
  } else {
    "error: $cityReviewAtlasError"
  }),
  $(if ($cityReviewAtlas -and $cityReviewAtlas.summary) {
    "coverage: required=$($cityReviewAtlas.summary.requiredObjects), covered=$($cityReviewAtlas.summary.coveredObjects), criticalDirect=$($cityReviewAtlas.summary.criticalDirectEvidence)/$($cityReviewAtlas.summary.criticalObjects), screenBoothDirect=$($cityReviewAtlas.summary.screenOrBoothDirectEvidence)/$($cityReviewAtlas.summary.screenOrBoothObjects), targetHits=$($cityReviewAtlas.summary.targetableCriticalTargetHits)/$($cityReviewAtlas.summary.targetableCriticalObjects), zones=$($cityReviewAtlas.summary.zones)"
  }),
  "reportPath: $cityReviewAtlasPath",
  "markdownPath: $cityReviewAtlasMarkdownPath",
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

if ($FailOnIssueSeverity) {
  $failureSeverityRank = @{
    critical = 4
    high = 3
    medium = 2
    low = 1
  }
  $failureThreshold = $failureSeverityRank[$FailOnIssueSeverity]
  $failingIssueCount = @($allIssues | Where-Object {
    $failureSeverityRank.ContainsKey([string]$_.severity) -and $failureSeverityRank[[string]$_.severity] -ge $failureThreshold
  }).Count

  if ($failingIssueCount -gt 0) {
    Write-Host "[full-city-clean-pass] failing: $failingIssueCount issue(s) at or above '$FailOnIssueSeverity'."
    exit 1
  }
}
