Add-Type -AssemblyName System.Drawing

function New-PwaIcon([int]$Size, [string]$Path) {
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 15, 116, 115))

  $pad = [int]($Size * 0.18)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

  $cy = $Size / 2
  $barW = $Size - (2 * $pad)
  $barH = [int]($Size * 0.12)
  $g.FillRectangle($brush, $pad, ($cy - ($barH / 2)), $barW, $barH)

  $endW = [int]($Size * 0.16)
  $endH = [int]($Size * 0.34)
  $g.FillRectangle($brush, $pad, ($cy - ($endH / 2)), $endW, $endH)
  $g.FillRectangle($brush, ($Size - $pad - $endW), ($cy - ($endH / 2)), $endW, $endH)

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $brush.Dispose()
}

New-PwaIcon 192 "public/pwa-192.png"
New-PwaIcon 512 "public/pwa-512.png"
New-PwaIcon 180 "public/apple-touch-icon.png"
Write-Output "icons-created"
