Param(
    [Parameter(Mandatory=$true)]
    [string] $InDir,
    [Parameter(Mandatory=$true)]
    [string] $OutDir,
    [Parameter(Mandatory=$true)]
    [string] $InstructionFile,
    [Parameter(Mandatory=$true)]
    [string] $FileFormat
)

$insts = Get-Content "$InstructionFile"
$length = $insts.Length.ToString().Length
$file = 1;
if (-not (Test-Path $OutDir))
{
    New-Item -ItemType Directory $OutDir | Out-Null
}
foreach ($inst in $insts)
{
    $img = @($inst -split " " | ForEach-Object { "$_.$FileFormat" })
    Write-Host "Merging $($img -join " ") => $file.$FileFormat"
    $img = @($img | ForEach-Object { Join-Path "$InDir" "$_" })
    $out = Join-Path "$OutDir" ("{0:d$length}.$FileFormat" -f $file)
    magick @img -append $out
    $file++;
}