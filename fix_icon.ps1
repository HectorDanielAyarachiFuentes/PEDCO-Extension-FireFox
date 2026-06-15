Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Ramoncito\.antigravity-ide\PEDCO-Extension-FireFox\icons\PEDCO_Blanco.png"
$destPath = "C:\Users\Ramoncito\.antigravity-ide\PEDCO-Extension-FireFox\icons\PEDCO_Blanco_Square.png"

$img = [System.Drawing.Image]::FromFile($sourcePath)
$size = [Math]::Max($img.Width, $img.Height)

$bmp = New-Object System.Drawing.Bitmap $size, $size
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.Clear([System.Drawing.Color]::Transparent)

$x = [int](($size - $img.Width) / 2)
$y = [int](($size - $img.Height) / 2)

$graphics.DrawImage($img, $x, $y, $img.Width, $img.Height)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bmp.Dispose()
$img.Dispose()
