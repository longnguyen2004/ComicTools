Param(
    [Parameter(Mandatory = $true)]
    [string] $InDir,
    [Parameter(Mandatory = $true)]
    [string] $OutDir,
    [Parameter(Mandatory = $true)]
    [string] $InstructionFile,
    [Parameter(Mandatory = $true)]
    [string] $FileFormat
)

$insts = @(Get-Content "$InstructionFile")
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory $OutDir | Out-Null
}
$files = (Get-ChildItem $InDir -Filter "*.$FileFormat");
$inst_dict = @{};
foreach ($inst in $insts)
{
    $img, $offset = $inst -split " ";
    $inst_dict[$img] = $offset;
}
foreach ($file in $files) {
    if (-not $inst_dict.Contains($file.BaseName)) {
        Write-Host "Not splitting $($file.Name)"
        Copy-Item $file $OutDir
    }
    else
    {
        Write-Host "Splitting $($file.Name)"
        $options = @($file.FullName);
        $height = magick identify -ping -format "%[height]" $file.FullName
        $offset = @(0) + $inst_dict[$file.BaseName] + @($height) | ForEach-Object { [int]$_ }
        for ($i = 0; $i -lt $offset.Length - 1; $i++) {
            $output = Join-Path "$OutDir" "$($file.BaseName)-$($i+1).$FileFormat"
            $start = $offset[$i];
            $end = $offset[$i + 1];
            $length = $end - $start;
            $options += @(
                "(",
                "-clone", "0",
                "-crop", "x$length+0+$start",
                "+repage",
                "-write", "$output",
                ")"
            )
        }
        magick @options NULL:
    }
}