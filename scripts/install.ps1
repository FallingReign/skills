param(
  [Parameter(Position = 0)]
  [string]$SkillName
)

$ErrorActionPreference = "Stop"

$repo = "FallingReign/skills"
$target = $repo

if ($SkillName) {
  $target = "$repo/$SkillName"
}

Write-Host "Installing skills from: $target"
npx skills@latest add $target
