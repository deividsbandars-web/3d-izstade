$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dateStamp = '2026-03-29'

$diagnosticsRoot = Join-Path $repoRoot 'diagnostics\chatgpt'
$fullBundleName = "PROJECT_DIAGNOSTIC_BUNDLE_${dateStamp}_FULL_WEB3D_RELEASE"
$reviewBundleName = "WARPALA_EXPO_CHATGPT_REVIEW_PACKAGE_${dateStamp}"
$fullBundleDir = Join-Path $diagnosticsRoot $fullBundleName
$reviewBundleDir = Join-Path $diagnosticsRoot $reviewBundleName
$fullBundleZip = "${fullBundleDir}.zip"
$reviewBundleZip = "${reviewBundleDir}.zip"

$fullBundleFiles = @(
  'README.md',
  '.env.example',
  'vercel.json',
  'vite.config.ts',
  'src/config/runtimeEnv.ts',
  'src/modules/expo/components/ExpoWorldScene.tsx',
  'src/modules/expo/components/ArrivalReveal.tsx',
  'src/modules/expo/components/CuratedSkylineRing.tsx',
  'src/modules/expo/components/ExpoLandmarkLayer.tsx',
  'src/modules/expo/components/DistrictAnchorNodes.tsx',
  'src/modules/expo/components/BoothArchitectureKit.tsx',
  'src/modules/expo/components/AmbientMotionLayer.tsx',
  'src/modules/expo/components/ExpoEvidenceProbe.tsx',
  'src/modules/expo/components/ExpoWorldHud.tsx',
  'src/modules/expo/lib/boulevardArtPass.ts',
  'src/modules/expo/lib/boulevardLayout.ts',
  'src/modules/expo/lib/districtLandmarkPlan.ts',
  'src/modules/expo/lib/districtTheme.ts',
  'src/modules/expo/lib/expoAnalytics.ts',
  'src/modules/expo/lib/sceneContract.ts',
  'src/modules/expo/lib/skylinePlacement.ts',
  'src/modules/expo/lib/sponsorBoothPresentation.ts',
  'src/modules/expo/lib/sponsorScreenLayout.ts',
  'src/modules/expo/sceneWorld.ts',
  'src/modules/expo/services/pixelStreamingConfig.ts',
  'src/modules/expo/state/expoRuntime.ts',
  'src/modules/expo/__tests__/boothArchitectureKit.test.ts',
  'src/modules/expo/__tests__/boulevardArtPass.test.ts',
  'src/modules/expo/__tests__/districtLandmarkPlan.test.ts',
  'src/modules/expo/__tests__/districtTheme.test.ts',
  'src/modules/expo/__tests__/expoRuntime.test.ts',
  'src/modules/expo/__tests__/sceneWorld.test.ts',
  'src/modules/expo/__tests__/skylinePlacement.test.ts',
  'src/modules/expo/__tests__/sponsorBoothPresentation.test.ts',
  'src/modules/expo/__tests__/sponsorScreenLayout.test.ts',
  'src/__tests__/runtimeEnv.test.ts',
  'docs/release/ENVIRONMENT_MATRIX.md',
  'docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md',
  'docs/release/WEB3D_EXPO_EVIDENCE_CAPTURE.md',
  'docs/release/WEB3D_EXPO_RELEASE_OPERATIONS.md',
  'docs/release/WEB3D_EXPO_SPATIAL_QA_CHECKLIST.md',
  'docs/adr/ADR-0001-canonical-web3d-expo-release-topology.md',
  'docs/adr/ADR-0002-expo-collision-layer-policy.md',
  'scripts/release-smoke-check.mjs',
  'scripts/audit-expo-scene-theme-mapping.mjs'
)

$reviewFiles = @(
  'src/modules/expo/components/ExpoWorldScene.tsx',
  'src/modules/expo/components/ArrivalReveal.tsx',
  'src/modules/expo/components/CuratedSkylineRing.tsx',
  'src/modules/expo/components/ExpoLandmarkLayer.tsx',
  'src/modules/expo/components/DistrictAnchorNodes.tsx',
  'src/modules/expo/components/BoothArchitectureKit.tsx',
  'src/modules/expo/components/AmbientMotionLayer.tsx',
  'src/modules/expo/lib/boulevardLayout.ts',
  'src/modules/expo/lib/boulevardArtPass.ts',
  'src/modules/expo/lib/districtTheme.ts',
  'src/modules/expo/lib/districtLandmarkPlan.ts',
  'src/modules/expo/lib/skylinePlacement.ts',
  'src/modules/expo/lib/sponsorBoothPresentation.ts',
  'src/modules/expo/lib/sponsorScreenLayout.ts',
  'src/modules/expo/sceneWorld.ts',
  'src/modules/expo/state/expoRuntime.ts',
  'src/config/runtimeEnv.ts',
  'docs/release/WEB3D_EXPO_SPATIAL_QA_CHECKLIST.md',
  'docs/release/WEB3D_EXPO_EVIDENCE_CAPTURE.md'
)

function Reset-Directory {
  param([string]$Path)
  if (Test-Path $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
  New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Copy-RelativeFiles {
  param(
    [string]$SourceRoot,
    [string]$DestinationRoot,
    [string[]]$RelativePaths
  )

  foreach ($relativePath in $RelativePaths) {
    $sourcePath = Join-Path $SourceRoot $relativePath
    if (-not (Test-Path $sourcePath)) {
      continue
    }

    $destinationPath = Join-Path $DestinationRoot $relativePath
    $destinationDir = Split-Path -Parent $destinationPath
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
  }
}

function Write-TextFile {
  param(
    [string]$Path,
    [string]$Content
  )

  $dir = Split-Path -Parent $Path
  if ($dir) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  Set-Content -LiteralPath $Path -Value $Content -Encoding UTF8
}

Reset-Directory -Path $fullBundleDir
Reset-Directory -Path $reviewBundleDir

Copy-RelativeFiles -SourceRoot $repoRoot -DestinationRoot (Join-Path $fullBundleDir 'repo-slice') -RelativePaths $fullBundleFiles
Copy-RelativeFiles -SourceRoot $repoRoot -DestinationRoot (Join-Path $reviewBundleDir 'project-slice') -RelativePaths $reviewFiles

$reportsDir = Join-Path $fullBundleDir 'reports'
$runtimeDir = Join-Path $fullBundleDir 'runtime-artifacts'
$inventoriesDir = Join-Path $fullBundleDir 'inventories'

New-Item -ItemType Directory -Path $reportsDir,$runtimeDir,$inventoriesDir -Force | Out-Null

$head = (git rev-parse HEAD).Trim()
$recentCommits = git log --oneline -12
$branches = git show-ref --heads
$untrackedFiles = git ls-files --others --exclude-standard
$trackedExpoAssets = git ls-files public\textures\expo public\models
$textureInventory = Get-ChildItem (Join-Path $repoRoot 'public\textures\expo') -Recurse | Select-Object FullName, Length

Write-TextFile -Path (Join-Path $reportsDir 'git_head.txt') -Content $head
Write-TextFile -Path (Join-Path $reportsDir 'recent_commits.txt') -Content ($recentCommits -join [Environment]::NewLine)
Write-TextFile -Path (Join-Path $reportsDir 'show_ref_heads.txt') -Content ($branches -join [Environment]::NewLine)
Write-TextFile -Path (Join-Path $reportsDir 'untracked_files.txt') -Content ($untrackedFiles -join [Environment]::NewLine)
Write-TextFile -Path (Join-Path $inventoriesDir 'tracked_expo_assets.txt') -Content ($trackedExpoAssets -join [Environment]::NewLine)
$textureInventory | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $inventoriesDir 'expo_texture_inventory.json') -Encoding UTF8

$healthPayload = Invoke-RestMethod 'http://127.0.0.1:3000/health'
$scenePayload = Invoke-RestMethod 'http://127.0.0.1:3000/api/expo/scene'
$pixelStatusPayload = Invoke-RestMethod 'http://127.0.0.1:3000/api/pixel-streaming/status'

$healthPayload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $runtimeDir 'local_health.json') -Encoding UTF8
$scenePayload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $runtimeDir 'local_expo_scene.json') -Encoding UTF8
$pixelStatusPayload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $runtimeDir 'local_pixel_streaming_status.json') -Encoding UTF8

$previousThemeAuditSceneUrl = $env:THEME_AUDIT_SCENE_URL
$previousReleaseBaseUrl = $env:RELEASE_BASE_URL

$env:THEME_AUDIT_SCENE_URL = 'http://127.0.0.1:3000/api/expo/scene'
$themeAuditRaw = node scripts\audit-expo-scene-theme-mapping.mjs

$env:RELEASE_BASE_URL = 'http://127.0.0.1:3000'
$smokeCheckRaw = node scripts\release-smoke-check.mjs

if ($null -eq $previousThemeAuditSceneUrl) {
  Remove-Item Env:THEME_AUDIT_SCENE_URL -ErrorAction SilentlyContinue
} else {
  $env:THEME_AUDIT_SCENE_URL = $previousThemeAuditSceneUrl
}

if ($null -eq $previousReleaseBaseUrl) {
  Remove-Item Env:RELEASE_BASE_URL -ErrorAction SilentlyContinue
} else {
  $env:RELEASE_BASE_URL = $previousReleaseBaseUrl
}

Write-TextFile -Path (Join-Path $reportsDir 'theme_audit.json') -Content ($themeAuditRaw -join [Environment]::NewLine)
Write-TextFile -Path (Join-Path $reportsDir 'release_smoke_check.txt') -Content ($smokeCheckRaw -join [Environment]::NewLine)

$spawnAndCamera = @"
Warpala Expo spawn and camera notes
Date: $dateStamp

Release-safe sponsor start view:
- source: arrival-main
- code path: src/modules/expo/sceneWorld.ts -> buildExpoSponsorStartView(...)
- transform:
  - position = [centerX, 5, arrivalZ + 30]
  - lookAt   = [centerX, 3.6, arrivalZ - 22]

Current player bootstrap camera before sponsor start view applies:
- code path: src/modules/expo/components/ExpoWorldScene.tsx -> Player()
- position = [-8, 5, 10]
- lookAt   = [0, 3, -24]

Current runtime note:
- The sponsor runtime no longer derives the start view from realistic_city.glb bounds.
- Spawn source is the sponsor arrival sequence, not backdrop mesh bounds.
"@

$reviewReadme = @"
Warpala Expo ChatGPT Review Package ($dateStamp)

This package is a focused project slice for deep technical review of the current sponsor boulevard runtime.

Includes:
- the main Expo/Web3D runtime files
- the most important release docs
- a fresh local runtime scene snapshot from /api/expo/scene
- spawn and camera notes extracted from the current code path

Primary analysis focus:
- sponsor boulevard runtime architecture
- world assembly and spatial composition
- movement/collision policy
- skyline and scenic-layer safety
- sponsor booth presentation
- release readiness and visual/performance tradeoffs
"@

$reviewPrompt = @"
You are reviewing the Warpala Web3D sponsor expo runtime.

Analyze the attached project slice deeply. Focus on:
- world assembly
- sponsor boulevard runtime path
- camera and spawn framing
- skyline/scenic layer safety
- booth architecture and sponsor visibility
- movement/collision model
- release readiness, runtime fragility, and visual wow quality

Use the included runtime-scene.json and SPAWN_AND_CAMERA.md as ground truth references.

I want:
1. architecture summary
2. current strengths
3. current blockers and hidden risks
4. release-readiness gaps
5. prioritized implementation plan
6. a Codex-ready execution prompt for the next engineering pass
"@

$fullReadme = @"
Warpala Web3D Expo Full Diagnostic Bundle ($dateStamp)

This bundle is intended for external deep analysis in ChatGPT or another reviewer model.

Contents:
- repo-slice: key runtime, docs, tests, and build config
- runtime-artifacts: fresh local snapshots from /health, /api/expo/scene, and /api/pixel-streaming/status
- reports: git head, recent commits, theme audit, smoke check, and untracked-file notes
- inventories: Expo texture inventory and tracked asset inventory

Important recent facts:
- current head: $head
- sponsor runtime is now free-roam across the full district bounds
- spawn is sponsor-arrival-driven, not city-bound-driven
- production runtime currently contains graceful fallbacks for missing Expo textures

Use this bundle to evaluate:
- release architecture
- Expo/Web3D runtime correctness
- scene composition
- deployment/runtime fragility
- asset readiness
- remaining enterprise-release blockers
"@

$fullPrompt = @"
You are the principal technical reviewer for the Warpala Web3D sponsor expo.

Deeply analyze the attached full diagnostic bundle. Base your conclusions on the actual source files, tests, runtime snapshots, and release docs provided.

I need:
1. a clear summary of the current architecture and runtime path
2. the strongest parts of the current implementation
3. the real remaining blockers for enterprise-grade sponsor release
4. all hidden runtime, deployment, asset, spatial, UX, and performance risks
5. a prioritized release-hardening roadmap
6. a practical Codex execution prompt that tells Codex exactly what to implement next

Be precise, technical, and decisive. Avoid generic advice. Optimize for a sponsor-facing production Web3D expo, not a prototype.
"@

$bundleContents = [ordered]@{
  date = $dateStamp
  head = $head
  fullBundle = $fullBundleName
  reviewBundle = $reviewBundleName
  runtimeArtifacts = @(
    'runtime-artifacts/local_health.json',
    'runtime-artifacts/local_expo_scene.json',
    'runtime-artifacts/local_pixel_streaming_status.json'
  )
  reports = @(
    'reports/git_head.txt',
    'reports/recent_commits.txt',
    'reports/show_ref_heads.txt',
    'reports/untracked_files.txt',
    'reports/theme_audit.json',
    'reports/release_smoke_check.txt'
  )
  inventories = @(
    'inventories/tracked_expo_assets.txt',
    'inventories/expo_texture_inventory.json'
  )
  repoSliceCount = $fullBundleFiles.Count
  reviewSliceCount = $reviewFiles.Count
}

$bundleContents | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $fullBundleDir "BUNDLE_CONTENTS_${dateStamp}.json") -Encoding UTF8

Write-TextFile -Path (Join-Path $fullBundleDir 'README_FOR_CHATGPT.txt') -Content $fullReadme
Write-TextFile -Path (Join-Path $fullBundleDir 'PROMPT_FOR_CHATGPT.txt') -Content $fullPrompt

Write-TextFile -Path (Join-Path $reviewBundleDir 'README_FOR_CHATGPT.txt') -Content $reviewReadme
Write-TextFile -Path (Join-Path $reviewBundleDir 'PROMPT_FOR_CHATGPT.txt') -Content $reviewPrompt
Write-TextFile -Path (Join-Path $reviewBundleDir 'SPAWN_AND_CAMERA.md') -Content $spawnAndCamera
$scenePayload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $reviewBundleDir 'runtime-scene.json') -Encoding UTF8
$healthPayload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $reviewBundleDir 'runtime-health.json') -Encoding UTF8

if (Test-Path $fullBundleZip) {
  Remove-Item -LiteralPath $fullBundleZip -Force
}
if (Test-Path $reviewBundleZip) {
  Remove-Item -LiteralPath $reviewBundleZip -Force
}

Compress-Archive -Path (Join-Path $fullBundleDir '*') -DestinationPath $fullBundleZip -CompressionLevel Optimal
Compress-Archive -Path (Join-Path $reviewBundleDir '*') -DestinationPath $reviewBundleZip -CompressionLevel Optimal

Write-Host "Created:"
Write-Host $fullBundleDir
Write-Host $fullBundleZip
Write-Host $reviewBundleDir
Write-Host $reviewBundleZip
