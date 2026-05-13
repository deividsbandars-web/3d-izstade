param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'http://localhost:5173/expo-3d?operator=1&expoData=review',
  [string]$OutputDir = 'C:\3d\tmp-expo-zone-shots',
  [string]$VercelProtectionBypass = '',
  [string[]]$Zones = @('left-marquee', 'right-marquee', 'center-spine', 'sponsor-boulevard-left', 'sponsor-boulevard-right')
)

$ErrorActionPreference = 'Stop'

function Resolve-WsUrl {
  param(
    [string]$JsonUrl,
    [string]$PreferredUrl
  )

  $targets = Invoke-RestMethod -Uri $JsonUrl -TimeoutSec 5
  $pageTargets = @($targets | Where-Object {
    $_.webSocketDebuggerUrl -and $_.type -eq 'page'
  })

  $preferred = $pageTargets | Where-Object {
    $_.webSocketDebuggerUrl -and $_.url -eq $PreferredUrl
  } | Select-Object -First 1

  if ($preferred) {
    return [string]$preferred.webSocketDebuggerUrl
  }

  $expoPage = $pageTargets | Where-Object {
    ([string]$_.url).Contains('/expo-3d')
  } | Select-Object -First 1
  if ($expoPage) {
    return [string]$expoPage.webSocketDebuggerUrl
  }

  $firstPage = $pageTargets | Select-Object -First 1
  if ($firstPage) {
    return [string]$firstPage.webSocketDebuggerUrl
  }

  $fallback = $targets | Where-Object { $_.webSocketDebuggerUrl } | Select-Object -First 1
  if ($fallback) {
    return [string]$fallback.webSocketDebuggerUrl
  }

  throw "No webSocketDebuggerUrl found in $JsonUrl"
}

function Connect-Cdp {
  param([string]$WsUrl)
  $ws = [System.Net.WebSockets.ClientWebSocket]::new()
  $ws.ConnectAsync([Uri]$WsUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  return $ws
}

$script:msgId = 0

function Send-Cdp {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$Method,
    $Params
  )
  $script:msgId++
  $payload = @{ id = $script:msgId; method = $Method }
  if ($null -ne $Params) { $payload.params = $Params }
  $json = $payload | ConvertTo-Json -Depth 40 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $segment = [ArraySegment[byte]]::new($bytes)
  $Ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  return $script:msgId
}

function Read-CdpUntil {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [int]$TargetId
  )
  $buffer = New-Object byte[] 262144
  while ($true) {
    $ms = New-Object System.IO.MemoryStream
    do {
      $segment = [ArraySegment[byte]]::new($buffer)
      $cts = [Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds(30))
      try {
        $result = $Ws.ReceiveAsync($segment, $cts.Token).GetAwaiter().GetResult()
      } catch [OperationCanceledException] {
        throw "Timed out waiting for CDP response id $TargetId"
      } finally {
        $cts.Dispose()
      }
      if ($result.Count -gt 0) { $ms.Write($buffer, 0, $result.Count) }
    } while (-not $result.EndOfMessage)

    $text = [Text.Encoding]::UTF8.GetString($ms.ToArray())
    if (-not $text) { continue }
    $obj = $text | ConvertFrom-Json
    if ($obj.id -eq $TargetId) { return $obj }
  }
}

function Invoke-Cdp {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$Method,
    $Params
  )
  return Read-CdpUntil -Ws $Ws -TargetId (Send-Cdp -Ws $Ws -Method $Method -Params $Params)
}

function Eval-Expr {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$Expression
  )
  return Invoke-Cdp -Ws $Ws -Method 'Runtime.evaluate' -Params @{
    expression = $Expression
    returnByValue = $true
    awaitPromise = $true
  }
}

function Set-RequestBypassHeaders {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  if (-not $VercelProtectionBypass.Trim()) {
    return
  }

  [void](Invoke-Cdp -Ws $Ws -Method 'Network.setExtraHTTPHeaders' -Params @{
    headers = @{
      'x-vercel-protection-bypass' = $VercelProtectionBypass.Trim()
      'x-vercel-set-bypass-cookie' = 'true'
    }
  })
}

function Clear-SiteOriginStorage {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  try {
    $uri = [Uri]$SiteUrl
    $origin = "$($uri.Scheme)://$($uri.Host)"
    if (-not $uri.IsDefaultPort) {
      $origin = "$origin`:$($uri.Port)"
    }

    [void](Invoke-Cdp -Ws $Ws -Method 'Storage.clearDataForOrigin' -Params @{
      origin = $origin
      storageTypes = 'all'
    })
  } catch {
    Write-Warning "Could not clear site origin storage before capture: $($_.Exception.Message)"
  }
}

function Ensure-OperatorApi {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  for ($i = 0; $i -lt 40; $i++) {
    $result = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  return Boolean(api && typeof api.reviewZone === 'function');
})()
"@
    if ($result.result.result.value) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw 'Operator API did not become ready'
}

function Ensure-ExpoWorldReady {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  [void](Invoke-Cdp -Ws $Ws -Method 'Page.navigate' -Params @{ url = $SiteUrl })
  Start-Sleep -Seconds 8

  [void](Eval-Expr -Ws $Ws -Expression @"
(() => {
  const nodes = [...document.querySelectorAll('button, [role="button"], a')];
  const target = nodes.find((node) => {
    const text = ((node.innerText || node.textContent || '').trim()).toLowerCase();
    return text.includes('walk lite') || text.includes('enter') || text.includes('start');
  });
  if (target) {
    target.click();
    return true;
  }
  return false;
})()
"@)

  Start-Sleep -Seconds 8
  Ensure-OperatorApi -Ws $Ws
}

function Wait-ForZone {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$ZoneId
  )

  $zoneLiteral = $ZoneId.Replace('\', '\\').Replace("'", "\'")
  for ($i = 0; $i -lt 30; $i++) {
    $result = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  const snapshot = api?.getSnapshot?.();
  return snapshot?.operatorZoneId === '$zoneLiteral';
})()
"@
    if ($result.result.result.value) {
      Start-Sleep -Milliseconds 800
      return $true
    }
    Start-Sleep -Milliseconds 300
  }

  return $false
}

function Click-ZoneButton {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$ZoneId
  )

  $zoneLiteral = $ZoneId.Replace('\', '\\').Replace("'", "\'")
  $result = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const zoneId = '$zoneLiteral';
  const nodes = [...document.querySelectorAll('button, [role="button"]')];
  const target = nodes.find((node) => {
    const text = ((node.innerText || node.textContent || '').trim()).toLowerCase();
    return text.includes(zoneId.toLowerCase());
  });
  if (!target) {
    return false;
  }
  target.click();
  return true;
})()
"@

  return [bool]$result.result.result.value
}

function Get-OperatorSnapshot {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  $result = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  return api?.getSnapshot?.() ?? null;
})()
"@

  return $result.result.result.value
}

function Wait-ForZoneSnapshot {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$ZoneId
  )

  $bestSnapshot = $null
  for ($i = 0; $i -lt 14; $i++) {
    $snapshot = Get-OperatorSnapshot -Ws $Ws
    if ($snapshot -and [string]$snapshot.operatorZoneId -eq $ZoneId -and [string]$snapshot.operatorZoneValidation.zoneId -eq $ZoneId) {
      $bestSnapshot = $snapshot
      if ([string]$snapshot.operatorZoneValidation.status -eq 'ok') {
        return $snapshot
      }
    }

    Start-Sleep -Milliseconds 250
  }

  if ($bestSnapshot) {
    return $bestSnapshot
  }

  return Get-OperatorSnapshot -Ws $Ws
}

function Set-OverlayVisibility {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [bool]$Visible
  )

  $visibilityLiteral = if ($Visible) { 'visible' } else { 'hidden' }
  $displayLiteral = if ($Visible) { '' } else { 'none' }
  $pointerEventsLiteral = if ($Visible) { 'auto' } else { 'none' }
  [void](Eval-Expr -Ws $Ws -Expression @"
(() => {
  const nodes = [
    document.querySelector('[data-expo-operator-overlay=\"true\"]'),
    document.querySelector('[data-expo-world-hud-top=\"true\"]'),
    document.querySelector('[data-expo-world-hud-radar=\"true\"]'),
  ].filter(Boolean);
  if (nodes.length === 0) {
    return false;
  }
  for (const node of nodes) {
    node.style.visibility = '$visibilityLiteral';
    node.style.pointerEvents = '$pointerEventsLiteral';
    node.style.display = '$displayLiteral';
  }
  return true;
})()
"@)
}

function Get-PngQualityStats {
  param([byte[]]$Bytes)

  $stream = $null
  $bitmap = $null
  try {
    if (-not $script:CaptureQualityDrawingLoaded) {
      Add-Type -AssemblyName System.Drawing
      $script:CaptureQualityDrawingLoaded = $true
    }

    $stream = [System.IO.MemoryStream]::new($Bytes)
    $bitmap = [System.Drawing.Bitmap]::new($stream)
    $width = [int]$bitmap.Width
    $height = [int]$bitmap.Height
    $stepX = [Math]::Max(1, [int][Math]::Floor($width / 40.0))
    $stepY = [Math]::Max(1, [int][Math]::Floor($height / 24.0))
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
      return @{ brightnessAverage = 0.0; brightnessStdDev = 0.0; colorBucketCount = 0 }
    }

    $average = $sum / $sampleCount
    $variance = [Math]::Max(0.0, ($sumSquares / $sampleCount) - ($average * $average))

    return @{
      brightnessAverage = [Math]::Round($average * 100.0, 2)
      brightnessStdDev = [Math]::Round([Math]::Sqrt($variance) * 100.0, 2)
      colorBucketCount = $colorBuckets.Count
    }
  } catch {
    return @{ brightnessAverage = 0.0; brightnessStdDev = 0.0; colorBucketCount = 0 }
  } finally {
    if ($bitmap) { $bitmap.Dispose() }
    if ($stream) { $stream.Dispose() }
  }
}

function Get-ZoneHitSamples {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string]$ZoneId
  )

  $pointsResult = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const normalize = (value) => {
    const length = Math.hypot(value[0], value[1], value[2]);
    return length > 0 ? [value[0] / length, value[1] / length, value[2] / length] : null;
  };
  const dot = (left, right) => (left[0] * right[0]) + (left[1] * right[1]) + (left[2] * right[2]);
  const cross = (left, right) => [
    (left[1] * right[2]) - (left[2] * right[1]),
    (left[2] * right[0]) - (left[0] * right[2]),
    (left[0] * right[1]) - (left[1] * right[0]),
  ];
  const tuple3 = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? value : null;
  const criticalLayers = new Set(['booth', 'city-screen-surface', 'mega-landmark', 'stadium-screen-surface']);
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    return [];
  }
  const rect = canvas.getBoundingClientRect();
  const xs = [0.14, 0.26, 0.38, 0.50, 0.62, 0.74, 0.86];
  const ys = [0.18, 0.32, 0.46, 0.60, 0.74];
  const gridPoints = ys.flatMap((fy, row) => xs.map((fx, column) => ({
    column,
    fx,
    fy,
    row,
    sampleType: 'grid',
    x: Math.round(rect.left + (rect.width * fx)),
    y: Math.round(rect.top + (rect.height * fy)),
  })));

  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  const snapshot = api?.getSnapshot?.();
  const startView = snapshot?.operatorZone?.startView;
  const cameraPosition = tuple3(startView?.position);
  const lookAt = tuple3(startView?.lookAt);
  if (!snapshot?.registryById || !cameraPosition || !lookAt) {
    return gridPoints;
  }

  const forward = normalize([
    lookAt[0] - cameraPosition[0],
    lookAt[1] - cameraPosition[1],
    lookAt[2] - cameraPosition[2],
  ]);
  if (!forward) {
    return gridPoints;
  }

  const worldUp = [0, 1, 0];
  const right = normalize(cross(forward, worldUp)) ?? [1, 0, 0];
  const up = normalize(cross(right, forward)) ?? [0, 1, 0];
  const aspect = rect.width / Math.max(1, rect.height);
  const tanHalfFov = Math.tan((60 * Math.PI / 180) / 2);
  const expectedIds = new Set(snapshot.operatorZone?.expectedKeyObjectIds ?? []);
  const byId = new Map();
  for (const entry of Object.values(snapshot.registryById)) {
    if (
      !entry?.id
      || byId.has(entry.id)
      || (!criticalLayers.has(entry.layer) && !expectedIds.has(entry.id))
      || !tuple3(entry.position)
    ) {
      continue;
    }
    byId.set(entry.id, entry);
  }

  const targetCenter = (entry) => {
    const reviewTargetPosition = tuple3(entry.reviewTargetPosition);
    if (reviewTargetPosition) {
      return reviewTargetPosition;
    }

    const position = tuple3(entry.position);
    if (!position) {
      return null;
    }
    const size = tuple3(entry.size) ?? [0, 0, 0];
    if (entry.layer === 'city-screen-surface' || entry.layer === 'stadium-screen-surface') {
      const rotation = tuple3(entry.rotation) ?? [0, 0, 0];
      const yaw = rotation[1];
      const normal = [Math.sin(yaw), 0, Math.cos(yaw)];
      const toCamera = [
        cameraPosition[0] - position[0],
        cameraPosition[1] - position[1],
        cameraPosition[2] - position[2],
      ];
      const side = dot(toCamera, normal) >= 0 ? 1 : -1;
      const frontOffset = Math.max(0.8, size[2] * 0.68);
      return [
        position[0] + (normal[0] * side * frontOffset),
        position[1],
        position[2] + (normal[2] * side * frontOffset),
      ];
    }
    if (entry.layer === 'booth') {
      return [position[0], position[1] + (size[1] * 0.56), position[2]];
    }
    return position;
  };

  const projectPoint = (entry, point, anchor, anchorScore) => {
    const delta = [
      point[0] - cameraPosition[0],
      point[1] - cameraPosition[1],
      point[2] - cameraPosition[2],
    ];
    const depth = dot(delta, forward);
    if (depth <= 1 || depth > 6200) {
      return null;
    }

    const cameraX = dot(delta, right);
    const cameraY = dot(delta, up);
    const ndcX = cameraX / (depth * tanHalfFov * aspect);
    const ndcY = cameraY / (depth * tanHalfFov);
    const fx = 0.5 + (ndcX * 0.5);
    const fy = 0.5 - (ndcY * 0.5);
    if (fx < 0.08 || fx > 0.92 || fy < 0.08 || fy > 0.88) {
      return null;
    }

    return {
      anchorScore,
      depth,
      fx,
      fy,
      sampleType: 'target',
      targetAnchor: anchor,
      targetLayer: entry.layer,
      targetObjectId: entry.id,
      x: Math.round(rect.left + (rect.width * fx)),
      y: Math.round(rect.top + (rect.height * fy)),
    };
  };

  const targetGroups = [...byId.values()]
    .map((entry) => {
      const center = targetCenter(entry);
      if (!center) {
        return null;
      }
      const size = tuple3(entry.size) ?? [0, 0, 0];
      const isScreenSurface = entry.layer === 'city-screen-surface' || entry.layer === 'stadium-screen-surface';
      const horizontal = isScreenSurface
        ? Math.min(220, Math.max(16, size[0] * 0.38))
        : Math.min(150, Math.max(10, Math.max(size[0], size[2]) * 0.26));
      const vertical = isScreenSurface
        ? Math.min(168, Math.max(12, size[1] * 0.38))
        : Math.min(128, Math.max(8, size[1] * 0.28));
      const rotation = tuple3(entry.rotation) ?? [0, 0, 0];
      const yaw = rotation[1];
      const localRight = isScreenSurface ? [Math.cos(yaw), 0, -Math.sin(yaw)] : right;
      const anchors = isScreenSurface
        ? [
            ['center', center, 0],
            ['upper', [center[0], center[1] + vertical, center[2]], 1],
            ['lower', [center[0], center[1] - (vertical * 0.35), center[2]], 2],
            ['left', [center[0] - (localRight[0] * horizontal), center[1], center[2] - (localRight[2] * horizontal)], 3],
            ['right', [center[0] + (localRight[0] * horizontal), center[1], center[2] + (localRight[2] * horizontal)], 4],
            ['upper-left', [center[0] - (localRight[0] * horizontal), center[1] + (vertical * 0.55), center[2] - (localRight[2] * horizontal)], 5],
            ['upper-right', [center[0] + (localRight[0] * horizontal), center[1] + (vertical * 0.55), center[2] + (localRight[2] * horizontal)], 6],
          ]
        : [
            ['center', center, 0],
            ['upper', [center[0], center[1] + vertical, center[2]], 1],
            ['lower', [center[0], center[1] - (vertical * 0.45), center[2]], 2],
            ['left', [center[0] - (right[0] * horizontal), center[1], center[2] - (right[2] * horizontal)], 3],
            ['right', [center[0] + (right[0] * horizontal), center[1], center[2] + (right[2] * horizontal)], 4],
          ];
      const points = anchors
        .map(([anchor, point, anchorScore]) => projectPoint(entry, point, anchor, anchorScore))
        .filter(Boolean)
        .sort((left, right) => left.anchorScore - right.anchorScore);
      if (points.length === 0) {
        return null;
      }

      const objectDepth = Math.min(...points.map((point) => point.depth));
      const layerScore =
        entry.layer === 'city-screen-surface' || entry.layer === 'stadium-screen-surface'
          ? -2000
          : entry.layer === 'booth'
            ? -1000
            : 0;
      const reviewTargetScore = tuple3(entry.reviewTargetPosition) ? -5000 : 0;
      return {
        objectScore: (expectedIds.has(entry.id) ? -100000 : 0) + reviewTargetScore + layerScore + objectDepth,
        points,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.objectScore - right.objectScore);

  const targetPoints = [];
  const targetObjectBudget = 24;
  const targetPointBudget = 54;
  const primaryGroups = targetGroups.slice(0, targetObjectBudget);
  for (const group of primaryGroups) {
    targetPoints.push(group.points[0]);
  }
  for (const group of primaryGroups) {
    for (const point of group.points.slice(1)) {
      if (targetPoints.length >= targetPointBudget) {
        break;
      }
      targetPoints.push(point);
    }
    if (targetPoints.length >= targetPointBudget) {
      break;
    }
  }

  const indexedTargetPoints = targetPoints.map((point, index) => ({ ...point, column: index, row: -1 }));

  return [...indexedTargetPoints, ...gridPoints];
})()
"@

  $points = @($pointsResult.result.result.value)
  $pointsJson = ConvertTo-Json -InputObject @($points) -Depth 20 -Compress
  try {
    $batchResult = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const inspect = window.__WARPALA_EXPO_BATCH_INSPECT_POINTS__;
  if (typeof inspect !== 'function') {
    return null;
  }
  return inspect($pointsJson);
})()
"@
    $batchValues = @($batchResult.result.result.value)
    if ($batchValues.Count -gt 0) {
      $batchSamples = @()
      foreach ($sample in $batchValues) {
        $batchSamples += [pscustomobject]@{
          clickStack = @($sample.clickStack)
          clickTarget = $sample.clickTarget
          column = [int]$sample.column
          fx = [double]$sample.fx
          fy = [double]$sample.fy
          row = [int]$sample.row
          sampleType = if ($sample.sampleType) { [string]$sample.sampleType } else { 'grid' }
          targetAnchor = if ($sample.targetAnchor) { [string]$sample.targetAnchor } else { $null }
          targetLayer = if ($sample.targetLayer) { [string]$sample.targetLayer } else { $null }
          targetObjectId = if ($sample.targetObjectId) { [string]$sample.targetObjectId } else { $null }
          x = [int]$sample.x
          y = [int]$sample.y
          zoneId = $ZoneId
        }
      }
      return $batchSamples
    }
  } catch {
    Write-Warning "Batch point inspection failed for $ZoneId, falling back to click sampling: $($_.Exception.Message)"
  }

  $samples = @()
  foreach ($point in $points) {
    [void](Invoke-Cdp -Ws $Ws -Method 'Input.dispatchMouseEvent' -Params @{
      type = 'mouseMoved'
      x = [double]$point.x
      y = [double]$point.y
    })
    [void](Invoke-Cdp -Ws $Ws -Method 'Input.dispatchMouseEvent' -Params @{
      type = 'mousePressed'
      button = 'left'
      clickCount = 1
      x = [double]$point.x
      y = [double]$point.y
    })
    [void](Invoke-Cdp -Ws $Ws -Method 'Input.dispatchMouseEvent' -Params @{
      type = 'mouseReleased'
      button = 'left'
      clickCount = 1
      x = [double]$point.x
      y = [double]$point.y
    })
    Start-Sleep -Milliseconds 70

    $hitSnapshot = Get-OperatorSnapshot -Ws $Ws
    $samples += [pscustomobject]@{
      clickStack = @($hitSnapshot.clickStack)
      clickTarget = $hitSnapshot.clickTarget
      column = [int]$point.column
      fx = [double]$point.fx
      fy = [double]$point.fy
      row = [int]$point.row
      sampleType = if ($point.sampleType) { [string]$point.sampleType } else { 'grid' }
      targetAnchor = if ($point.targetAnchor) { [string]$point.targetAnchor } else { $null }
      targetLayer = if ($point.targetLayer) { [string]$point.targetLayer } else { $null }
      targetObjectId = if ($point.targetObjectId) { [string]$point.targetObjectId } else { $null }
      x = [int]$point.x
      y = [int]$point.y
      zoneId = $ZoneId
    }
  }

  return $samples
}

function Capture-StableScreenshotBytes {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  $bestBytes = $null
  $bestScore = -1.0

  for ($attempt = 0; $attempt -lt 4; $attempt++) {
    if ($attempt -gt 0) {
      Start-Sleep -Milliseconds 420
    }

    $screenshot = Invoke-Cdp -Ws $Ws -Method 'Page.captureScreenshot' -Params @{
      format = 'png'
      captureBeyondViewport = $false
      fromSurface = $true
    }
    $bytes = [Convert]::FromBase64String($screenshot.result.data)
    $stats = Get-PngQualityStats -Bytes $bytes
    $score = [double]$stats.brightnessStdDev + ([double]$stats.colorBucketCount / 10.0) + ([double]$bytes.Length / 1000000.0)

    if ($score -gt $bestScore) {
      $bestScore = $score
      $bestBytes = $bytes
    }

    $isBlackFrame = [double]$stats.brightnessAverage -lt 2.0 -and [double]$stats.brightnessStdDev -lt 4.0 -and [int]$stats.colorBucketCount -lt 6
    if (-not $isBlackFrame) {
      return $bytes
    }
  }

  return $bestBytes
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$wsUrl = Resolve-WsUrl -JsonUrl $BrowserJsonUrl -PreferredUrl $SiteUrl
$ws = Connect-Cdp -WsUrl $wsUrl

try {
  [void](Invoke-Cdp -Ws $ws -Method 'Page.enable' -Params @{})
  [void](Invoke-Cdp -Ws $ws -Method 'Runtime.enable' -Params @{})
  [void](Invoke-Cdp -Ws $ws -Method 'Network.enable' -Params @{})
  [void](Invoke-Cdp -Ws $ws -Method 'Network.setCacheDisabled' -Params @{ cacheDisabled = $true })
  [void](Invoke-Cdp -Ws $ws -Method 'Network.clearBrowserCache' -Params @{})
  Clear-SiteOriginStorage -Ws $ws
  Set-RequestBypassHeaders -Ws $ws
  [void](Invoke-Cdp -Ws $ws -Method 'Emulation.setDeviceMetricsOverride' -Params @{
    width = 1600
    height = 960
    deviceScaleFactor = 1
    mobile = $false
  })

  Ensure-ExpoWorldReady -Ws $ws

  # Warm up one render pass to avoid occasional black first capture frame.
  if ($Zones.Count -gt 0) {
    $warmupZoneId = $Zones[0]
    [void](Eval-Expr -Ws $ws -Expression @"
(async () => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  await api.reviewZone('$($warmupZoneId.Replace('\', '\\').Replace("'", "\'"))');
  return true;
})()
"@)
    Start-Sleep -Milliseconds 900
  }

  $manifest = @()
  for ($zoneIndex = 0; $zoneIndex -lt $Zones.Count; $zoneIndex++) {
    $zoneId = $Zones[$zoneIndex]
    [void](Eval-Expr -Ws $ws -Expression @"
(async () => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  await api.reviewZone('$($zoneId.Replace('\', '\\').Replace("'", "\'"))');
  return true;
})()
"@)
    $settled = Wait-ForZone -Ws $ws -ZoneId $zoneId
    if (-not $settled) {
      $clicked = Click-ZoneButton -Ws $ws -ZoneId $zoneId
      if ($clicked) {
        Start-Sleep -Milliseconds 400
        $settled = Wait-ForZone -Ws $ws -ZoneId $zoneId
      }
    }
    if (-not $settled) {
      Write-Warning "Zone did not fully settle before capture: $zoneId"
      Start-Sleep -Milliseconds 1200
    }

    $snapshot = Wait-ForZoneSnapshot -Ws $ws -ZoneId $zoneId
    Set-OverlayVisibility -Ws $ws -Visible $false
    Start-Sleep -Milliseconds 520
    $screenshotBytes = Capture-StableScreenshotBytes -Ws $ws
    $hitSamples = Get-ZoneHitSamples -Ws $ws -ZoneId $zoneId
    Set-OverlayVisibility -Ws $ws -Visible $true
    $postCaptureSnapshot = Wait-ForZoneSnapshot -Ws $ws -ZoneId $zoneId
    if ($postCaptureSnapshot) {
      $snapshot = $postCaptureSnapshot
    }

    $filePath = Join-Path $OutputDir "$zoneId.png"
    [IO.File]::WriteAllBytes($filePath, $screenshotBytes)
    if ($snapshot) {
      $snapshot | Add-Member -NotePropertyName 'operatorHitSamples' -NotePropertyValue $hitSamples -Force
      $snapshot | ConvertTo-Json -Depth 30 | Set-Content -Path (Join-Path $OutputDir "$zoneId.snapshot.json") -Encoding UTF8
    }
    $manifest += @{
      file = $filePath
      hitSampleCount = @($hitSamples).Count
      operatorZoneId = $snapshot.operatorZoneId
      playerPos = $snapshot.playerPos
      zoneId = $zoneId
    }
  }

  $manifest | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $OutputDir 'manifest.json') -Encoding UTF8
  $manifest | ConvertTo-Json -Depth 10
}
finally {
  $ws.Dispose()
}
