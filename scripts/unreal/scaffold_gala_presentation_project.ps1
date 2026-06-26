param(
    [string]$SourceProjectRoot = "C:\3d\WarpalaUE5",
    [string]$TargetProjectRoot = "C:\3d\GALA_PresentationUE5",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Copy-Tree {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Missing source path: $Source"
    }

    Ensure-Directory -Path $Destination
    Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

$sourceContent = Join-Path $SourceProjectRoot "Content\WoodHouse_GALA"
$targetContentRoot = Join-Path $TargetProjectRoot "Content"
$targetGalaContent = Join-Path $targetContentRoot "WoodHouse_GALA"
$targetConfig = Join-Path $TargetProjectRoot "Config"
$sourceUntitledMap = Join-Path $SourceProjectRoot "Content\Untitled.umap"
$sourceExternalActorsUntitledRoot = Join-Path $SourceProjectRoot "Content\__ExternalActors__\Untitled"
$sourceExternalActorsWarpalaUntitledRoot = Join-Path $SourceProjectRoot "Content\__ExternalActors__\Warpala\Maps\Untitled"
$sourceExternalObjectsUntitledRoot = Join-Path $SourceProjectRoot "Content\__ExternalObjects__\Untitled"
$sourceExternalObjectsWarpalaUntitledRoot = Join-Path $SourceProjectRoot "Content\__ExternalObjects__\Warpala\Maps\Untitled"
$targetExternalActorsRoot = Join-Path $targetContentRoot "__ExternalActors__"
$targetExternalObjectsRoot = Join-Path $targetContentRoot "__ExternalObjects__"

if ((Test-Path -LiteralPath $TargetProjectRoot) -and -not $Force) {
    throw "Target already exists: $TargetProjectRoot. Re-run with -Force only if you want config/content overwritten."
}

Ensure-Directory -Path $TargetProjectRoot
Ensure-Directory -Path $targetContentRoot
Ensure-Directory -Path $targetConfig

if (Test-Path -LiteralPath $targetGalaContent) {
    Remove-Item -LiteralPath $targetGalaContent -Recurse -Force
}

Copy-Tree -Source $sourceContent -Destination $targetContentRoot

if (Test-Path -LiteralPath $sourceUntitledMap) {
    Copy-Item -LiteralPath $sourceUntitledMap -Destination $targetContentRoot -Force
}

Ensure-Directory -Path $targetExternalActorsRoot
Ensure-Directory -Path $targetExternalObjectsRoot

if (Test-Path -LiteralPath $sourceExternalActorsUntitledRoot) {
    Copy-Tree -Source $sourceExternalActorsUntitledRoot -Destination $targetExternalActorsRoot
}

if (Test-Path -LiteralPath $sourceExternalActorsWarpalaUntitledRoot) {
    $targetWarpalaMaps = Join-Path $targetExternalActorsRoot "Warpala\Maps"
    Ensure-Directory -Path $targetWarpalaMaps
    Copy-Tree -Source $sourceExternalActorsWarpalaUntitledRoot -Destination $targetWarpalaMaps
}

if (Test-Path -LiteralPath $sourceExternalObjectsUntitledRoot) {
    Copy-Tree -Source $sourceExternalObjectsUntitledRoot -Destination $targetExternalObjectsRoot
}

if (Test-Path -LiteralPath $sourceExternalObjectsWarpalaUntitledRoot) {
    $targetWarpalaObjectMaps = Join-Path $targetExternalObjectsRoot "Warpala\Maps"
    Ensure-Directory -Path $targetWarpalaObjectMaps
    Copy-Tree -Source $sourceExternalObjectsWarpalaUntitledRoot -Destination $targetWarpalaObjectMaps
}

$uproject = @'
{
  "FileVersion": 3,
  "EngineAssociation": "5.7",
  "Category": "Architecture",
  "Description": "Minimal GALA house presentation project.",
  "Modules": [],
  "Plugins": [
    {
      "Name": "PythonScriptPlugin",
      "Enabled": true
    },
    {
      "Name": "EditorScriptingUtilities",
      "Enabled": true
    },
    {
      "Name": "MovieRenderPipeline",
      "Enabled": true
    }
  ]
}
'@
Set-Content -LiteralPath (Join-Path $TargetProjectRoot "GALA_PresentationUE5.uproject") -Value $uproject -Encoding utf8

$defaultEngine = @'
[/Script/EngineSettings.GameMapsSettings]
GameDefaultMap=/Game/WoodHouse_GALA/Levels/LVL_WoodHouse_GALA_Complete
EditorStartupMap=/Game/WoodHouse_GALA/Levels/LVL_WoodHouse_GALA_Complete

[/Script/Engine.RendererSettings]
r.DefaultFeature.AutoExposure=False
r.DefaultFeature.MotionBlur=False
'@
Set-Content -LiteralPath (Join-Path $targetConfig "DefaultEngine.ini") -Value $defaultEngine -Encoding utf8

$defaultGame = @'
[/Script/EngineSettings.GeneralProjectSettings]
ProjectName=GALA_PresentationUE5
ProjectDisplayedTitle=NSLOCTEXT("[/Script/EngineSettings]", "GALAProjectTitle", "GALA Presentation UE5")
'@
Set-Content -LiteralPath (Join-Path $targetConfig "DefaultGame.ini") -Value $defaultGame -Encoding utf8

$defaultEditor = @'
[/Script/UnrealEd.EditorLoadingSavingSettings]
bForceCompilationAtStartup=False
'@
Set-Content -LiteralPath (Join-Path $targetConfig "DefaultEditor.ini") -Value $defaultEditor -Encoding utf8

$readme = @"
# GALA Presentation UE5

This is a minimal Unreal project scaffold for the finished GALA presentation workflow.

Source content copied from:
$sourceContent

Startup map:
/Game/WoodHouse_GALA/Levels/LVL_WoodHouse_GALA_Complete

Intended use:
- import the frozen Blender finished-presentation FBX if needed;
- render the finished house only;
- avoid loading unrelated Warpala city systems.
"@
Set-Content -LiteralPath (Join-Path $TargetProjectRoot "README.md") -Value $readme -Encoding utf8

[pscustomobject]@{
    TargetProjectRoot = $TargetProjectRoot
    UProject = (Join-Path $TargetProjectRoot "GALA_PresentationUE5.uproject")
    StartupMap = "/Game/WoodHouse_GALA/Levels/LVL_WoodHouse_GALA_Complete"
    ContentCopied = (Test-Path -LiteralPath $targetGalaContent)
    UntitledMapCopied = (Test-Path -LiteralPath (Join-Path $targetContentRoot "Untitled.umap"))
    ExternalActorsUntitledCopied = (Test-Path -LiteralPath (Join-Path $targetExternalActorsRoot "Untitled"))
    ExternalActorsWarpalaUntitledCopied = (Test-Path -LiteralPath (Join-Path $targetExternalActorsRoot "Warpala\\Maps\\Untitled"))
    ExternalObjectsUntitledCopied = (Test-Path -LiteralPath (Join-Path $targetExternalObjectsRoot "Untitled"))
    ExternalObjectsWarpalaUntitledCopied = (Test-Path -LiteralPath (Join-Path $targetExternalObjectsRoot "Warpala\\Maps\\Untitled"))
}
