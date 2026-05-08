param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'https://www.30sek24.com/expo-3d?operator=1',
  [string]$OutputPath = 'C:\3d\tmp-expo-zone-review.json',
  [string]$VercelProtectionBypass = '',
  [Parameter(Position = 4, ValueFromRemainingArguments = $true)]
  [string[]]$Zones = @()
)

$ErrorActionPreference = 'Stop'

function Resolve-WsUrl {
  param(
    [string]$JsonUrl,
    [string]$PreferredUrl
  )

  $targets = Invoke-RestMethod -Uri $JsonUrl -TimeoutSec 5
  if (-not $targets) {
    throw "No CDP targets returned from $JsonUrl"
  }

  $preferred = $targets | Where-Object {
    $_.webSocketDebuggerUrl -and ($_.url -eq $PreferredUrl)
  } | Select-Object -First 1

  if (-not $preferred) {
    $preferred = $targets | Where-Object {
      $_.webSocketDebuggerUrl -and (
        ($_.url -like "*expo-3d*") -or
        ($_.title -like "*expo*")
      )
    } | Select-Object -First 1
  }

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
  $json = $payload | ConvertTo-Json -Depth 30 -Compress
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
    Write-Warning "Could not clear site origin storage before review: $($_.Exception.Message)"
  }
}

function Wait-ForOperatorApi {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  for ($i = 0; $i -lt 40; $i++) {
    $result = Eval-Expr -Ws $Ws -Expression @"
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  return {
    hasApi: Boolean(api),
    hasReviewZone: Boolean(api && typeof api.reviewZone === 'function'),
    href: location.href
  };
})()
"@
    if ($result.result.result.value.hasReviewZone) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw 'Operator API did not become ready'
}

function Ensure-ExpoWorldReady {
  param([System.Net.WebSockets.ClientWebSocket]$Ws)

  [void](Eval-Expr -Ws $Ws -Expression @"
(async () => {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  } catch {}
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  return location.href;
})()
"@)

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
    return (target.innerText || target.textContent || '').trim();
  }
  return null;
})()
"@)

  Start-Sleep -Seconds 8
  Wait-ForOperatorApi -Ws $Ws
}

function Invoke-Review {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [string[]]$ZoneIds
  )

  $normalizedZoneIds = @(
    $ZoneIds |
      ForEach-Object { [string]$_ -split ',' } |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ }
  )

  if ($normalizedZoneIds.Count -gt 0) {
    $zonesJson = ConvertTo-Json -InputObject $normalizedZoneIds -Compress
    return Eval-Expr -Ws $Ws -Expression @"
(async () => {
  const zones = $zonesJson;
  const reports = [];
  for (const zoneId of zones) {
    const report = await window.__WARPALA_EXPO_REVIEW_OPERATOR__.reviewZone(zoneId);
    reports.push(report);
  }
  return reports;
})()
"@
  }

  return Eval-Expr -Ws $Ws -Expression @"
(async () => {
  return await window.__WARPALA_EXPO_REVIEW_OPERATOR__.reviewAllZones();
})()
"@
}

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
  $review = Invoke-Review -Ws $ws -ZoneIds $Zones
  $value = $review.result.result.value
  if ($null -eq $value) {
    throw "CDP review returned no serializable value: $($review | ConvertTo-Json -Depth 12 -Compress)"
  }

  $outputDir = Split-Path -Parent $OutputPath
  if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  }

  $json = ConvertTo-Json -InputObject $value -Depth 40
  [System.IO.File]::WriteAllText($OutputPath, $json, [System.Text.UTF8Encoding]::new($false))
  Write-Output $json
}
finally {
  $ws.Dispose()
}
