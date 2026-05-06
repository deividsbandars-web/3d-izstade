param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'http://localhost:5173/expo-3d?operator=1',
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
  $preferred = $targets | Where-Object {
    $_.webSocketDebuggerUrl -and $_.url -eq $PreferredUrl
  } | Select-Object -First 1

  if ($preferred) {
    return [string]$preferred.webSocketDebuggerUrl
  }

  $firstPage = $targets | Where-Object { $_.webSocketDebuggerUrl } | Select-Object -First 1
  if ($firstPage) {
    return [string]$firstPage.webSocketDebuggerUrl
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
      $result = $Ws.ReceiveAsync($segment, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
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
    }
  })
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

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$wsUrl = Resolve-WsUrl -JsonUrl $BrowserJsonUrl -PreferredUrl $SiteUrl
$ws = Connect-Cdp -WsUrl $wsUrl

try {
  [void](Invoke-Cdp -Ws $ws -Method 'Page.enable' -Params @{})
  [void](Invoke-Cdp -Ws $ws -Method 'Runtime.enable' -Params @{})
  [void](Invoke-Cdp -Ws $ws -Method 'Network.enable' -Params @{})
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

    $snapshot = Get-OperatorSnapshot -Ws $ws
    Set-OverlayVisibility -Ws $ws -Visible $false
    Start-Sleep -Milliseconds 320

    $screenshot = Invoke-Cdp -Ws $ws -Method 'Page.captureScreenshot' -Params @{
      format = 'png'
      captureBeyondViewport = $false
      fromSurface = $true
    }
    if ($zoneIndex -eq 0) {
      # First zone can still produce a black frame on some runs; capture a second frame and keep that.
      Start-Sleep -Milliseconds 240
      $screenshot = Invoke-Cdp -Ws $ws -Method 'Page.captureScreenshot' -Params @{
        format = 'png'
        captureBeyondViewport = $false
        fromSurface = $true
      }
    }
    Set-OverlayVisibility -Ws $ws -Visible $true

    $filePath = Join-Path $OutputDir "$zoneId.png"
    [IO.File]::WriteAllBytes($filePath, [Convert]::FromBase64String($screenshot.result.data))
    if ($snapshot) {
      $snapshot | ConvertTo-Json -Depth 30 | Set-Content -Path (Join-Path $OutputDir "$zoneId.snapshot.json") -Encoding UTF8
    }
    $manifest += @{
      file = $filePath
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
