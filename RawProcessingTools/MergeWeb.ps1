Param(
    [Parameter(Mandatory = $true)]
    [string] $InDir,
    [Parameter(Mandatory = $true)]
    [string] $OutDir,
    [Parameter(Mandatory = $true)]
    [int] $NumToMerge,
    [Parameter(Mandatory = $true)]
    [string] $FileFormat
)

if (-not (Test-Path $OutDir))
{
    New-Item -ItemType Directory $OutDir | Out-Null
}
$files = Get-ChildItem $InDir -Filter "*.$FileFormat" | ForEach-Object {$_.FullName};
$length = [Math]::Ceiling(($files.Length) / $NumToMerge).ToString().Length;
for (($i = 0), ($file = 1); $i -lt $files.Length; ($i += $NumToMerge), ($file++))
{
    $out = Join-Path $OutDir ("{0:d$length}.$FileFormat" -f $file);
    magick @($files[($i..($i + $NumToMerge - 1))]) -append $out;
}