param(
  [Parameter(Position = 0)]
  [string]$SkillName
)

$ErrorActionPreference = "Stop"

$repo = "FallingReign/skills"
$version = "0.1.0"
$target = $repo

if ($SkillName) {
  $target = "$repo/$SkillName"
}

$banner = @"
  ___      _ _ _              ____       _             
 | __|_ _ | | (_)_ _  __ _   | _ \___ __| |_ _  _ _ __ 
 | _|| ' \| | | | ' \/ _` |  |   / -_) _` | ' \| | '_ \
 |_| |_||_|_|_|_|_||_\__, |  |_|_\___\__,_|_||_|_| .__/
                     |___/                        |_|   
"@

Write-Host $banner
Write-Host "Version: $version"
Write-Host "Installing skills from: $target"
npx skills@latest add $target
