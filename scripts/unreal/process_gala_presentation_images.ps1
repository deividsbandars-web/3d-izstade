param(
    [string]$MrqDir = 'C:\3d\WarpalaUE5\Saved\MRQCaptures\GALA',
    [string]$BlenderDir = 'C:\3d\exports\drawings\blender_screenshots',
    [string]$OutputDir = 'C:\3d\exports\drawings\unreal_screenshots',
    [string]$ReportPath = 'C:\3d\exports\fbx\gala_unreal_finished_presentation_screenshot_report.json',
    [string]$ContactSheetPath = 'C:\3d\exports\drawings\unreal_screenshots\GALA_blender_vs_unreal_contact_sheet.png'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$views = @(
    @{ key = 'front'; label = 'Front' },
    @{ key = 'three_quarter'; label = '3/4 Perspective' },
    @{ key = 'terrace_closeup'; label = 'Terrace Detail' }
)

function Convert-AlphaToOpaquePng {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [System.Drawing.Color]$BackgroundColor
    )

    $source = [System.Drawing.Bitmap]::FromFile($InputPath)
    try {
        $bitmap = New-Object System.Drawing.Bitmap($source.Width, $source.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.Clear($BackgroundColor)
            $graphics.DrawImage($source, 0, 0, $source.Width, $source.Height)
            $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
    finally {
        $source.Dispose()
    }
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$bg = [System.Drawing.Color]::FromArgb(235, 236, 238)

$screens = @()
foreach ($view in $views) {
    $mrqPath = Join-Path $MrqDir ("GALA_{0}.0000.png" -f $view.key)
    $outPath = Join-Path $OutputDir ("GALA_unreal_{0}.png" -f $view.key)
    if (-not (Test-Path -LiteralPath $mrqPath)) {
        throw "Missing MRQ capture: $mrqPath"
    }
    Convert-AlphaToOpaquePng -InputPath $mrqPath -OutputPath $outPath -BackgroundColor $bg
    $item = Get-Item -LiteralPath $outPath
    $screens += [ordered]@{
        view = $view.key
        label = $view.label
        path = $outPath
        exists = $true
        size_bytes = $item.Length
    }
}

$tileW = 960
$tileH = 540
$margin = 24
$headerH = 56
$labelH = 34
$sheetW = ($tileW * 2) + ($margin * 3)
$sheetH = $headerH + (($tileH + $labelH + $margin) * $views.Count) + $margin

$sheet = New-Object System.Drawing.Bitmap($sheetW, $sheetH)
$g = [System.Drawing.Graphics]::FromImage($sheet)
try {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::FromArgb(20, 22, 26))

    $titleFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
    $labelFont = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
    $smallFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 245, 245))
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(176, 180, 188))
    $framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 64, 72), 1)
    try {
        $g.DrawString('GALA Blender vs Unreal', $titleFont, $whiteBrush, [float]$margin, [float]12)
        $g.DrawString('Left: Blender source of truth   Right: Unreal imported result', $smallFont, $subBrush, [float]$margin, [float]36)

        for ($i = 0; $i -lt $views.Count; $i++) {
            $view = $views[$i]
            $y = $headerH + $margin + ($i * ($tileH + $labelH + $margin))
            $blenderPath = Join-Path $BlenderDir ("GALA_blender_{0}.png" -f $view.key)
            $unrealPath = Join-Path $OutputDir ("GALA_unreal_{0}.png" -f $view.key)
            if (-not (Test-Path -LiteralPath $blenderPath)) { throw "Missing Blender screenshot: $blenderPath" }
            if (-not (Test-Path -LiteralPath $unrealPath)) { throw "Missing Unreal screenshot: $unrealPath" }

            $imgA = [System.Drawing.Image]::FromFile($blenderPath)
            $imgB = [System.Drawing.Image]::FromFile($unrealPath)
            try {
                $leftX = $margin
                $rightX = $margin * 2 + $tileW
                $g.FillRectangle([System.Drawing.Brushes]::Black, $leftX, $y, $tileW, $tileH)
                $g.FillRectangle([System.Drawing.Brushes]::Black, $rightX, $y, $tileW, $tileH)
                $g.DrawImage($imgA, $leftX, $y, $tileW, $tileH)
                $g.DrawImage($imgB, $rightX, $y, $tileW, $tileH)
                $g.DrawRectangle($framePen, $leftX, $y, $tileW, $tileH)
                $g.DrawRectangle($framePen, $rightX, $y, $tileW, $tileH)
                $g.DrawString(("{0} - Blender" -f $view.label), $labelFont, $whiteBrush, [float]($leftX + 8), [float]($y + $tileH + 4))
                $g.DrawString(("{0} - Unreal" -f $view.label), $labelFont, $whiteBrush, [float]($rightX + 8), [float]($y + $tileH + 4))
            }
            finally {
                $imgA.Dispose()
                $imgB.Dispose()
            }
        }
    }
    finally {
        $titleFont.Dispose()
        $labelFont.Dispose()
        $smallFont.Dispose()
        $whiteBrush.Dispose()
        $subBrush.Dispose()
        $framePen.Dispose()
    }

    $sheet.Save($ContactSheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $g.Dispose()
    $sheet.Dispose()
}

$report = [ordered]@{
    status = 'passed'
    generatedAt = (Get-Date).ToString('s')
    screenshots = $screens
    contact_sheet = $ContactSheetPath
}
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 6
