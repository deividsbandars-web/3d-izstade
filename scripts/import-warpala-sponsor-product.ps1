param(
  [string]$UnrealEngineDir = $env:WARPALA_UE_DIR,
  [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
  [string]$MapPath = '/Game/Warpala/Maps/Booth_Showroom_Main',
  [string]$PythonScript = 'C:\3d\WarpalaUE5\Scripts\ImportSponsorProductSlot.py',
  [string]$SponsorId = 'sponsor-concierge',
  [string]$SourceAssetPath = '',
  [string]$ExistingAssetPath = '',
  [string]$DestinationPath = '/Game/Warpala/SponsorProducts/sponsor-concierge',
  [string]$Location = '18,0,132',
  [string]$Rotation = '0,180,0',
  [string]$Scale = '0.65',
  [switch]$AllowWhileUnrealRunning,
  [switch]$AutoQuit,
  [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "[warpala-sponsor-product] $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
  param([string]$Message)
  Write-Host "[warpala-sponsor-product] ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Resolve-UnrealEngineDir {
  param([string]$RequestedPath)

  $candidates = @()
  if ($RequestedPath) {
    $candidates += $RequestedPath
  }

  $candidates += @(
    'C:\Program Files\Epic Games\UE_5.7',
    'D:\UE_5.7',
    'D:\Epic Games\UE_5.7'
  )

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }

    $editorPath = Join-Path $candidate 'Engine\Binaries\Win64\UnrealEditor.exe'
    if (Test-Path -LiteralPath $editorPath) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  Stop-WithMessage "Unreal Engine 5.7 was not found. Set WARPALA_UE_DIR or pass -UnrealEngineDir."
}

function Assert-VectorString {
  param(
    [string]$Name,
    [string]$Value,
    [switch]$AllowUniform
  )

  if ($AllowUniform -and $Value -match '^-?\d+(\.\d+)?$') {
    return
  }

  if ($Value -notmatch '^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$') {
    Stop-WithMessage "$Name must be formatted as x,y,z. Received: $Value"
  }
}

if (-not (Test-Path -LiteralPath $ProjectPath)) {
  Stop-WithMessage "Unreal project not found: $ProjectPath"
}

if (-not (Test-Path -LiteralPath $PythonScript)) {
  Stop-WithMessage "Sponsor product Python script not found: $PythonScript"
}

if ($MapPath -notmatch '^/Game/') {
  Stop-WithMessage "MapPath must be a /Game package path, for example /Game/Warpala/Maps/Booth_Showroom_Main."
}

if ($ExistingAssetPath -and $ExistingAssetPath -notmatch '^/Game/') {
  Stop-WithMessage "ExistingAssetPath must be a /Game asset path."
}

if ($DestinationPath -notmatch '^/Game/') {
  Stop-WithMessage "DestinationPath must be a /Game content path."
}

if ($SourceAssetPath) {
  if (-not (Test-Path -LiteralPath $SourceAssetPath)) {
    Stop-WithMessage "Source asset not found: $SourceAssetPath"
  }

  $extension = [System.IO.Path]::GetExtension($SourceAssetPath).ToLowerInvariant()
  $supportedExtensions = @('.fbx', '.obj', '.glb', '.gltf')
  if ($supportedExtensions -notcontains $extension) {
    Stop-WithMessage "Unsupported source asset extension '$extension'. Supported: $($supportedExtensions -join ', ')"
  }
}

if (-not $ValidateOnly -and -not $SourceAssetPath -and -not $ExistingAssetPath) {
  Stop-WithMessage "Pass -SourceAssetPath for a file import or -ExistingAssetPath for an existing Unreal StaticMesh."
}

Assert-VectorString -Name 'Location' -Value $Location
Assert-VectorString -Name 'Rotation' -Value $Rotation
Assert-VectorString -Name 'Scale' -Value $Scale -AllowUniform

$resolvedEngineDir = Resolve-UnrealEngineDir -RequestedPath $UnrealEngineDir
$resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$resolvedPythonScript = (Resolve-Path -LiteralPath $PythonScript).Path
$unrealEditor = Join-Path $resolvedEngineDir 'Engine\Binaries\Win64\UnrealEditor.exe'
$projectRoot = Split-Path -Parent $resolvedProjectPath

$mapRelativePath = ($MapPath -replace '^/Game/', 'Content/') + '.umap'
$mapDiskPath = Join-Path $projectRoot ($mapRelativePath -replace '/', '\')
if (-not (Test-Path -LiteralPath $mapDiskPath)) {
  Stop-WithMessage "Unreal map not found for MapPath $MapPath at $mapDiskPath"
}

$runningEditors = @(Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq 'UnrealEditor.exe' -and
    $_.CommandLine -like "*$resolvedProjectPath*"
  })

if ($runningEditors.Count -gt 0 -and $ValidateOnly) {
  Write-Host "[warpala-sponsor-product] Warning: Unreal is currently running for this project; close it before importing a product asset." -ForegroundColor Yellow
} elseif ($runningEditors.Count -gt 0 -and -not $AllowWhileUnrealRunning) {
  Stop-WithMessage "Unreal is already running for this project. Close it first, or pass -AllowWhileUnrealRunning if you intentionally accept the risk."
}

Write-Step "resolved paths"
Write-Host "Engine:      $resolvedEngineDir"
Write-Host "Project:     $resolvedProjectPath"
Write-Host "Map:         $MapPath"
Write-Host "Script:      $resolvedPythonScript"
Write-Host "Sponsor:     $SponsorId"
Write-Host "Destination: $DestinationPath"
if ($SourceAssetPath) {
  Write-Host "Source:      $SourceAssetPath"
}
if ($ExistingAssetPath) {
  Write-Host "Existing:    $ExistingAssetPath"
}
Write-Host "Location:    $Location"
Write-Host "Rotation:    $Rotation"
Write-Host "Scale:       $Scale"

if ($ValidateOnly) {
  Write-Host "[warpala-sponsor-product] Validation only requested; Unreal was not launched." -ForegroundColor Green
  Write-Host ""
  Write-Host "Import example:"
  Write-Host "  npm run import:unreal:sponsor-product -- -SourceAssetPath C:\path\product.fbx -AutoQuit"
  Write-Host ""
  Write-Host "Existing Unreal StaticMesh example:"
  Write-Host "  npm run import:unreal:sponsor-product -- -ExistingAssetPath /Game/Warpala/SponsorProducts/sponsor-concierge/product.product -AutoQuit"
  exit 0
}

Write-Step "launching Unreal sponsor product import"
$env:WARPALA_SPONSOR_PRODUCT_MAP = $MapPath
$env:WARPALA_SPONSOR_PRODUCT_ID = $SponsorId
$env:WARPALA_SPONSOR_PRODUCT_SOURCE = $SourceAssetPath
$env:WARPALA_SPONSOR_PRODUCT_EXISTING_ASSET = $ExistingAssetPath
$env:WARPALA_SPONSOR_PRODUCT_DESTINATION = $DestinationPath
$env:WARPALA_SPONSOR_PRODUCT_LOCATION = $Location
$env:WARPALA_SPONSOR_PRODUCT_ROTATION = $Rotation
$env:WARPALA_SPONSOR_PRODUCT_SCALE = $Scale
if ($AutoQuit) {
  $env:WARPALA_SPONSOR_PRODUCT_QUIT = '1'
} else {
  Remove-Item Env:\WARPALA_SPONSOR_PRODUCT_QUIT -ErrorAction SilentlyContinue
}

& $unrealEditor $resolvedProjectPath $MapPath `
  -log `
  -nop4 `
  -nosplash `
  "-ExecutePythonScript=$resolvedPythonScript"

if ($LASTEXITCODE -ne 0) {
  Stop-WithMessage "Unreal Editor exited with code $LASTEXITCODE."
}

Write-Host "[warpala-sponsor-product] Done." -ForegroundColor Green
