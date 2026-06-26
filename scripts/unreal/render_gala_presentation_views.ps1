param(
    [string]$ScriptPath = 'C:\3d\scripts\unreal\run_gala_mrq_single.ps1'
)

$ErrorActionPreference = 'Stop'

$views = @('front', 'three_quarter', 'terrace_closeup')
$results = @()

foreach ($view in $views) {
    Write-Host "Rendering $view..."
    $raw = & $ScriptPath -View $view -RestartEditor
    $results += ($raw | ConvertFrom-Json)
}

$results | ConvertTo-Json -Depth 6

