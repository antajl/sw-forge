$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$partsDir = Join-Path $root 'js\ui-parts'
$out = Join-Path $root 'js\ui.js'
$partNames = @(
  '01-preamble.js','02-theme-nav.js','03-i18n.js','04-main-tabs.js','05-stage-filters.js',
  '06-upload.js','06b-ui-utils.js','06c-dashboard-helpers.js','07-depth.js','08-dashboard.js',
  '09-table.js','10-formulas-ui.js','11-rules-ui.js','11-constants-ui.js','11-rules-bootstrap.js',
  '12-app-settings.js','13-changelog.js'
)
$missing = $partNames | Where-Object { -not (Test-Path (Join-Path $partsDir $_)) }
if ($missing.Count) { throw "Missing ui-parts: $($missing -join ', ') — run tools/split-ui-parts.ps1" }
$banner = @"
// =============================================
// ui.js — built from js/ui-parts/ (do not edit by hand)
// Rebuild: node tools/build-ui.mjs
// =============================================

"@
$body = ($partNames | ForEach-Object {
  $raw = Get-Content -LiteralPath (Join-Path $partsDir $_) -Raw -Encoding UTF8
  $raw -replace '(?m)^// ui-parts/[^\r\n]+\r?\n', ''
}) -join "`n"
[IO.File]::WriteAllText($out, $banner + $body, [Text.UTF8Encoding]::new($false))
Write-Host "wrote js/ui.js from $($partNames.Count) parts"
