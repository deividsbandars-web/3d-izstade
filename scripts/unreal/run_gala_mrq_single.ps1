param(
    [string]$ProjectPath = 'C:\3d\WarpalaUE5\WarpalaUE5.uproject',
    [string]$UnrealEditorPath = 'C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe',
    [string]$StatusPath = 'C:\3d\exports\fbx\gala_unreal_mrq_single_status.json',
    [string]$RequestedViewPath = 'C:\3d\exports\fbx\gala_requested_view.json',
    [string]$StartupRequestPath = 'C:\3d\exports\fbx\gala_editor_startup_request.json',
    [string]$BootstrapLogPath = 'C:\3d\exports\fbx\gala_editor_startup_bootstrap.json',
    [ValidateSet('front', 'three_quarter', 'terrace_closeup')]
    [string]$View = 'front',
    [int]$TimeoutSeconds = 360,
    [switch]$RestartEditor
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $UnrealEditorPath)) {
    throw "UnrealEditor.exe not found: $UnrealEditorPath"
}
if (-not (Test-Path -LiteralPath $ProjectPath)) {
    throw ".uproject not found: $ProjectPath"
}
$existing = Get-Process UnrealEditor -ErrorAction SilentlyContinue
if ($existing) {
    if (-not $RestartEditor) {
        throw "Unreal Editor is already running. Re-run with -RestartEditor or close it first."
    }
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Set-Content -LiteralPath $RequestedViewPath -Value (@{ view = $View } | ConvertTo-Json -Compress) -Encoding Ascii
Set-Content -LiteralPath $StartupRequestPath -Value (@{ mode = 'gala_mrq_single'; view = $View } | ConvertTo-Json -Compress) -Encoding Ascii

if (Test-Path -LiteralPath $StatusPath) {
    Remove-Item -LiteralPath $StatusPath -Force
}
if (Test-Path -LiteralPath $BootstrapLogPath) {
    Remove-Item -LiteralPath $BootstrapLogPath -Force
}

$proc = Start-Process -FilePath $UnrealEditorPath -ArgumentList @($ProjectPath, '-NoSplash') -PassThru

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$status = $null
$bootstrap = $null
while ((Get-Date) -lt $deadline) {
    if (Test-Path -LiteralPath $BootstrapLogPath) {
        $bootstrap = Get-Content -LiteralPath $BootstrapLogPath -Raw | ConvertFrom-Json
    }
    if (Test-Path -LiteralPath $StatusPath) {
        $status = Get-Content -LiteralPath $StatusPath -Raw | ConvertFrom-Json
        if ($status.renderFinished -eq $true) {
            break
        }
    }
    if ($proc.HasExited) {
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
}

if (Test-Path -LiteralPath $StatusPath) {
    Get-Content -LiteralPath $StatusPath -Raw
    exit 0
}

$bootstrapJson = if (Test-Path -LiteralPath $BootstrapLogPath) { Get-Content -LiteralPath $BootstrapLogPath -Raw } else { '' }
throw "GALA MRQ status file was not produced. ProcessId=$($proc.Id) Bootstrap=$bootstrapJson"
