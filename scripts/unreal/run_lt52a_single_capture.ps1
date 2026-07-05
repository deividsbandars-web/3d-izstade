param(
    [Parameter(Mandatory = $true)]
    [string]$CameraLabel,

    [Parameter(Mandatory = $true)]
    [string]$OutputDir,

    [Parameter(Mandatory = $true)]
    [string]$StatusPath,

    [int]$WaitSeconds = 80
)

$ErrorActionPreference = 'Stop'

$projectPath = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\LT52A_ModularHome_Unreal_POC.uproject'
$editorPath = 'C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe'
$requestPath = 'C:\3d\tmp\lt52a_mrq_single_request.json'
$pythonPath = 'C:/3d/scripts/unreal/render_lt52a_mrq_single.py'

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$payload = @{
    cameraLabel = $CameraLabel
    outputDir   = $OutputDir
    statusPath  = $StatusPath
}

$payload | ConvertTo-Json -Depth 4 | Set-Content -Path $requestPath -Encoding UTF8

Get-Process UnrealEditor -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

$args = @(
    $projectPath,
    '-NoSplash',
    '-ExecCmds=py ' + $pythonPath
)

$proc = Start-Process -FilePath $editorPath -ArgumentList $args -PassThru
Start-Sleep -Seconds $WaitSeconds

if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
}

Write-Output "capture-complete:$CameraLabel"
