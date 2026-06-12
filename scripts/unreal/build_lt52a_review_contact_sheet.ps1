param(
    [string]$InputRoot = 'C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\MRQCaptures\LT52A\review_batch\default',
    [string]$OutputDir = 'C:\3d\review_artifacts\lt52a_unreal_review',
    [string]$OutputName = '',
    [string]$Title = 'LT52A Unreal Review'
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

if ([string]::IsNullOrWhiteSpace($OutputName)) {
    $leaf = Split-Path $InputRoot -Leaf
    if ([string]::IsNullOrWhiteSpace($leaf)) { $leaf = 'review' }
    $OutputName = "lt52a_review_contact_sheet_$leaf.png"
}

$specs = @(
    @{ Label = 'Exterior';   Path = (Join-Path $InputRoot '01-exterior\frame_0000.png') },
    @{ Label = 'Overview';   Path = (Join-Path $InputRoot '02-overview\frame_0000.png') },
    @{ Label = 'Terrace';    Path = (Join-Path $InputRoot '03-terrace\frame_0000.png') },
    @{ Label = 'Living';     Path = (Join-Path $InputRoot '04-living\frame_0000.png') },
    @{ Label = 'Bedroom';    Path = (Join-Path $InputRoot '05-bedroom\frame_0000.png') },
    @{ Label = 'Bathroom';   Path = (Join-Path $InputRoot '06-bathroom\frame_0000.png') }
)

foreach ($spec in $specs) {
    if (-not (Test-Path -LiteralPath $spec.Path)) {
        throw "Missing review image: $($spec.Path)"
    }
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$tileWidth = 640
$tileHeight = 360
$headerHeight = 56
$labelHeight = 42
$margin = 24
$cols = 2
$rows = [int][Math]::Ceiling($specs.Count / $cols)
$sheetWidth = ($cols * $tileWidth) + (($cols + 1) * $margin)
$sheetHeight = $headerHeight + ($rows * ($tileHeight + $labelHeight)) + (($rows + 1) * $margin)

$bitmap = New-Object System.Drawing.Bitmap($sheetWidth, $sheetHeight)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.Clear([System.Drawing.Color]::FromArgb(18, 18, 22))

$titleFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
$labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 240, 240))
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170, 170, 180))
$framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(54, 54, 64), 1)

$graphics.DrawString($Title, $titleFont, $labelBrush, [float]$margin, [float]12)
$graphics.DrawString((Split-Path $InputRoot -Leaf), $subFont, $subBrush, [float]$margin, [float]38)

for ($i = 0; $i -lt $specs.Count; $i++) {
    $spec = $specs[$i]
    $col = $i % $cols
    $row = [int]($i / $cols)
    $x = $margin + ($col * ($tileWidth + $margin))
    $y = $headerHeight + $margin + ($row * ($tileHeight + $labelHeight + $margin))

    $image = [System.Drawing.Image]::FromFile($spec.Path)
    try {
        $graphics.FillRectangle([System.Drawing.Brushes]::Black, $x, $y, $tileWidth, $tileHeight)
        $graphics.DrawImage($image, $x, $y, $tileWidth, $tileHeight)
        $graphics.DrawRectangle($framePen, $x, $y, $tileWidth, $tileHeight)
        $graphics.DrawString($spec.Label, $font, $labelBrush, [float]($x + 6), [float]($y + $tileHeight + 4))
        $graphics.DrawString((Split-Path $spec.Path -Leaf), $subFont, $subBrush, [float]($x + 6), [float]($y + $tileHeight + 24))
    }
    finally {
        $image.Dispose()
    }
}

$outputPath = Join-Path $OutputDir $OutputName
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$manifest = [ordered]@{
    generatedAt = (Get-Date).ToString('s')
    inputRoot = $InputRoot
    outputPath = $outputPath
    title = $Title
    images = $specs | ForEach-Object {
        [ordered]@{
            label = $_.Label
            path = $_.Path
        }
    }
}
$manifestName = '{0}.manifest.json' -f [System.IO.Path]::GetFileNameWithoutExtension($OutputName)
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $OutputDir $manifestName) -Encoding UTF8

$graphics.Dispose()
$bitmap.Dispose()
$titleFont.Dispose()
$font.Dispose()
$subFont.Dispose()
$labelBrush.Dispose()
$subBrush.Dispose()
$framePen.Dispose()

Write-Output $outputPath
