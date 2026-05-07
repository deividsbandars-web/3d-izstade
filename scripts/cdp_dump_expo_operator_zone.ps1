param(
  [string]$BrowserJsonUrl = 'http://127.0.0.1:9230/json',
  [string]$SiteUrl = 'http://127.0.0.1:5173/expo-3d?operator=1',
  [string]$ZoneId = 'stadium-approach'
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

$wsUrl = Resolve-WsUrl -JsonUrl $BrowserJsonUrl -PreferredUrl $SiteUrl
$ws = Connect-Cdp -WsUrl $wsUrl

try {
  [void](Invoke-Cdp -Ws $ws -Method 'Page.enable' -Params @{})
  [void](Invoke-Cdp -Ws $ws -Method 'Runtime.enable' -Params @{})

  $zoneJson = $ZoneId | ConvertTo-Json -Compress
  $result = Eval-Expr -Ws $ws -Expression @"
(async () => {
  const zoneId = $zoneJson;
  const report = await window.__WARPALA_EXPO_REVIEW_OPERATOR__.reviewZone(zoneId);
  const snapshot = window.__WARPALA_EXPO_REVIEW_OPERATOR__.getSnapshot();
  const requestedZone = window.__WARPALA_EXPO_REVIEW_OPERATOR__.zones.find((zone) => zone.id === zoneId) ?? null;
  const requestedZoneValidation = snapshot.zones.find((zone) => zone.id === zoneId)?.validation ?? null;
  return {
    zoneId,
    report,
    requestedZone,
    centerStack: snapshot.centerStack,
    clickStack: snapshot.clickStack,
    centerTarget: snapshot.centerTarget,
    clickTarget: snapshot.clickTarget,
    requestedZoneValidation,
    activeZoneValidation: snapshot.operatorZoneValidation,
    resolvedTargets: snapshot.resolvedTargets,
  };
})()
"@

  $value = $result.result.result.value
  $value | ConvertTo-Json -Depth 40
}
finally {
  $ws.Dispose()
}
