# WARPALA FULL SYSTEM DIAGNOSTICS
Write-Output "=== WARPALA FULL DIAGNOSTICS ==="
Write-Output "Date: $(Get-Date)"

Write-Output "`n== 1. PROJECT STRUCTURE =="
Get-ChildItem -Path . -Exclude node_modules, .git | Select-Object Name

Write-Output "`n== 2. ENGINE CORE FILES =="
$coreFiles = @("src/modules/expo/Expo3D.tsx", "src/utils/threeUtils.ts", "src/utils/assetPipeline.ts")
foreach ($f in $coreFiles) {
    if (Test-Path $f) { Write-Output "✅ FOUND: $f" } else { Write-Output "❌ MISSING: $f" }
}

Write-Output "`n== 3. NPM STATUS =="
npm --version | ForEach-Object { "NPM Version: $_" }

Write-Output "`n== 4. RECENT GIT CHANGES =="
git log -n 5 --oneline

Write-Output "`n== 5. PORT STATUS =="
$ports = @(5173, 3000, 8888)
foreach ($port in $ports) {
    $check = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
    if ($check) { Write-Output "✅ Port ${port}: ACTIVE" } else { Write-Output "⚠️ Port ${port}: CLOSED" }
}

Write-Output "`n=== DIAGNOSTICS COMPLETE ==="
