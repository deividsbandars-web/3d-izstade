param(
    [string]$ProjectPath = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\LT52A_ModularHome_Unreal_POC.uproject',
    [string]$UnrealEditorPath = 'C:\Program Files\Epic Games\UE_5.7\Engine\Binaries\Win64\UnrealEditor.exe',
    [string]$BatchScriptPath = 'C:/3d/scripts/unreal/render_lt52a_mrq_batch.py',
    [string]$StatusPath = 'C:\3d\tmp\lt52a_mrq_batch_status.json',
    [string]$RequestPath = 'C:\3d\tmp\lt52a_mrq_batch_request.json',
    [string]$StartupHookRequestPath = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\PythonBootstrap\request.json',
    [string]$StartupHookStatusPath = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\PythonBootstrap\status.json',
    [ValidateSet('low', 'default', 'high')]
    [string]$Preset = 'default',
    [int]$TimeoutSeconds = 240,
    [switch]$RestartEditor
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $UnrealEditorPath)) {
    throw "UnrealEditor.exe not found: $UnrealEditorPath"
}
if (-not (Test-Path -LiteralPath $ProjectPath)) {
    throw ".uproject not found: $ProjectPath"
}
if (-not (Test-Path -LiteralPath ($BatchScriptPath -replace '/', '\\'))) {
    throw "Batch Python script not found: $BatchScriptPath"
}

$existing = Get-Process UnrealEditor -ErrorAction SilentlyContinue
if ($existing) {
    if (-not $RestartEditor) {
        throw "Unreal Editor is already running. Re-run with -RestartEditor or close it first."
    }
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 2
}

if (Test-Path -LiteralPath $StatusPath) {
    Remove-Item -LiteralPath $StatusPath -Force
}
if (Test-Path -LiteralPath $RequestPath) {
    Remove-Item -LiteralPath $RequestPath -Force
}
if (Test-Path -LiteralPath $StartupHookRequestPath) {
    Remove-Item -LiteralPath $StartupHookRequestPath -Force
}
if (Test-Path -LiteralPath $StartupHookStatusPath) {
    Remove-Item -LiteralPath $StartupHookStatusPath -Force
}

$presetConfig = switch ($Preset) {
    'low' {
        @{
            preset = 'low'
            width = 1280
            height = 720
            outputDirRoot = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\MRQCaptures\LT52A\review_batch\low'
        }
    }
    'high' {
        @{
            preset = 'high'
            width = 2560
            height = 1440
            outputDirRoot = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\MRQCaptures\LT52A\review_batch\high'
        }
    }
    default {
        @{
            preset = 'default'
            width = 1920
            height = 1080
            outputDirRoot = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\MRQCaptures\LT52A\review_batch\default'
        }
    }
}

$presetConfig | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $RequestPath -Encoding UTF8

$startupDir = Split-Path -Path $StartupHookRequestPath -Parent
New-Item -ItemType Directory -Path $startupDir -Force | Out-Null
@{
    scriptPath = ($BatchScriptPath -replace '/', '\')
    generatedAt = (Get-Date).ToString('s')
    mode = 'lt52a_mrq_batch'
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $StartupHookRequestPath -Encoding UTF8

$process = Start-Process -FilePath $UnrealEditorPath -ArgumentList @($ProjectPath, '-NoSplash') -PassThru

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $deadline) {
    if (Test-Path -LiteralPath $StatusPath) {
        $status = Get-Content -LiteralPath $StatusPath -Raw | ConvertFrom-Json
        if ($status.renderFinished -eq $true) {
            $status | ConvertTo-Json -Depth 8
            exit 0
        }
    }
    if (Test-Path -LiteralPath $StartupHookStatusPath) {
        $hook = Get-Content -LiteralPath $StartupHookStatusPath -Raw | ConvertFrom-Json
        if ($hook.phase -eq 'error') {
            $hook | ConvertTo-Json -Depth 8
            throw "Startup hook failed before MRQ batch finished."
        }
    }
    Start-Sleep -Seconds 2
}

if (Test-Path -LiteralPath $StatusPath) {
    Get-Content -LiteralPath $StatusPath -Raw
}
if (Test-Path -LiteralPath $StartupHookStatusPath) {
    Get-Content -LiteralPath $StartupHookStatusPath -Raw
}
throw "Timed out waiting for LT52A MRQ batch render to finish. ProcessId=$($process.Id)"
