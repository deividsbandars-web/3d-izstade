param(
  [string]$WsUrl = 'ws://127.0.0.1:9222/devtools/page/FC9CB9A7E04A7A7B15F87102BEFC2A63',
  [string]$OutputPath = 'C:\3d\tmp-staging-expo3d-screenshot.png',
  [string]$Zone = 'middle'
)

$ErrorActionPreference = 'Stop'

$ws = [System.Net.WebSockets.ClientWebSocket]::new()
$ws.ConnectAsync([Uri]$WsUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
$script:msgId = 0

function Send-Cdp($method, $params) {
  $script:msgId++
  $payload = @{ id = $script:msgId; method = $method }
  if ($null -ne $params) { $payload.params = $params }
  $json = $payload | ConvertTo-Json -Depth 20 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $seg = [ArraySegment[byte]]::new($bytes)
  $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  return $script:msgId
}

function Read-CdpUntil($targetId) {
  $buffer = New-Object byte[] 262144
  while ($true) {
    $ms = New-Object System.IO.MemoryStream
    do {
      $seg = [ArraySegment[byte]]::new($buffer)
      $res = $ws.ReceiveAsync($seg, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
      if ($res.Count -gt 0) { $ms.Write($buffer, 0, $res.Count) }
    } while (-not $res.EndOfMessage)
    $text = [Text.Encoding]::UTF8.GetString($ms.ToArray())
    if (-not $text) { continue }
    $obj = $text | ConvertFrom-Json
    if ($obj.id -eq $targetId) { return $obj }
  }
}

function Eval-Expr([string]$expr) {
  $id = Send-Cdp 'Runtime.evaluate' @{
    expression = $expr
    returnByValue = $true
    awaitPromise = $true
  }
  return Read-CdpUntil $id
}

[void](Read-CdpUntil (Send-Cdp 'Page.enable' @{}))
[void](Read-CdpUntil (Send-Cdp 'Runtime.enable' @{}))
[void](Read-CdpUntil (Send-Cdp 'Network.enable' @{}))
[void](Read-CdpUntil (Send-Cdp 'Network.clearBrowserCache' @{}))
[void](Read-CdpUntil (Send-Cdp 'Emulation.setDeviceMetricsOverride' @{
  width = 1600
  height = 960
  deviceScaleFactor = 1
  mobile = $false
}))

$clearExpr = @"
(async () => {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  } catch {}
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  return location.href;
})()
"@
[void](Eval-Expr $clearExpr)

[void](Send-Cdp 'Page.reload' @{ ignoreCache = $true })
Start-Sleep -Seconds 6

$clickExpr = @"
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
"@
[void](Eval-Expr $clickExpr)
Start-Sleep -Seconds 10

$cameraExpr = @"
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  if (api && typeof api.focusZone === 'function') {
    api.focusZone('__ZONE__');
    return 'focused-__ZONE__';
  }
  return 'no-operator';
})()
"@
[string]$cameraExpr = $cameraExpr.Replace('__ZONE__', $Zone)
[void](Eval-Expr $cameraExpr)
Start-Sleep -Seconds 2

$countExpr = @"
(() => {
  const src = window.__WARPALA_EXPO_INSPECT_SOURCES__ || {};
  const city = Array.isArray(src.city) ? src.city : [];
  const screens = city.filter(x => x && typeof x.layer === 'string' && x.layer.includes('screen'));
  return {
    href: location.href,
    canvasCount: document.querySelectorAll('canvas').length,
    screenEntryCount: screens.length,
    ids: screens.map(x => x.id),
    sample: screens.slice(0, 12).map(x => ({ id: x.id, layer: x.layer }))
  };
})()
"@
$count = Eval-Expr $countExpr

$shot = Read-CdpUntil (Send-Cdp 'Page.captureScreenshot' @{
  format = 'png'
  fromSurface = $true
})

[IO.File]::WriteAllBytes($OutputPath, [Convert]::FromBase64String($shot.result.data))
$count.result.result.value | ConvertTo-Json -Depth 20

$ws.Dispose()
