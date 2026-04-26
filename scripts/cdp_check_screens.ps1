param(
  [string]$WsUrl = 'ws://127.0.0.1:9222/devtools/page/FC9CB9A7E04A7A7B15F87102BEFC2A63'
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
Start-Sleep -Seconds 5

$clickExpr = @"
(() => {
  const nodes = [...document.querySelectorAll('button, [role="button"], a')];
  const labels = nodes
    .map(n => ((n.innerText || n.textContent || '').trim()))
    .filter(Boolean)
    .slice(0, 30);
  const target = nodes.find(n => {
    const t = ((n.innerText || n.textContent || '').trim()).toLowerCase();
    return t.includes('walk lite') || t.includes('drone view') || t.includes('enter') || t.includes('start');
  });
  if (target) {
    target.click();
    return { clicked: true, text: (target.innerText || target.textContent || '').trim(), labels };
  }
  return { clicked: false, text: null, labels };
})()
"@
$click = Eval-Expr $clickExpr
Start-Sleep -Seconds 8

$countExpr = @"
(() => {
  const src = window.__WARPALA_EXPO_INSPECT_SOURCES__ || {};
  const city = Array.isArray(src.city) ? src.city : [];
  const screens = city.filter(x => x && (
    (typeof x.kind === 'string' && x.kind === 'screen') ||
    (typeof x.layer === 'string' && x.layer.includes('screen'))
  ));
  const ids = screens.slice(0, 20).map(x => ({ id: x.id || null, layer: x.layer || null, kind: x.kind || null }));
  const byKind = city.reduce((acc, entry) => {
    const key = entry && entry.kind ? entry.kind : 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const maybeScreenIds = city
    .filter(x => x && (
      (x.id && String(x.id).toLowerCase().includes('screen')) ||
      (typeof x.layer === 'string' && x.layer.includes('screen'))
    ))
    .slice(0, 30)
    .map(x => ({ id: x.id, kind: x.kind || null, layer: x.layer || null }));
  const firstEntries = city.slice(0, 10);
  const namedEntries = city
    .filter(x => x && (x.id || x.name || x.label))
    .slice(0, 20);
  return {
    href: location.href,
    clicked: CLICK_RESULT,
    screenEntryCount: screens.length,
    totalCityEntries: city.length,
    byKind,
    sampleIds: ids,
    maybeScreenIds,
    firstEntries,
    namedEntries,
    scriptSources: [...document.querySelectorAll('script[src]')].map(s => s.src),
    canvasCount: document.querySelectorAll('canvas').length,
    bodyText: document.body ? document.body.innerText.slice(0, 800) : ''
  };
})()
"@
$countExpr = $countExpr.Replace('CLICK_RESULT', (($click.result.result.value | ConvertTo-Json -Depth 20 -Compress)))
$result = Eval-Expr $countExpr
$result.result.result.value | ConvertTo-Json -Depth 20

$ws.Dispose()
