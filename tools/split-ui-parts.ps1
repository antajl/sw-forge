$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

$bak = Join-Path $root 'js\ui.monolith.bak.js'

$partsDir = Join-Path $root 'js\ui-parts'

$lines = Get-Content -LiteralPath $bak -Encoding UTF8

$chunks = @(

  ,@('01-preamble.js', 5, 58)

  ,@('02-theme-nav.js', 59, 343)

  ,@('03-i18n.js', 344, 768)

  ,@('04-main-tabs.js', 769, 786)

  ,@('05-stage-filters.js', 787, 1092)

  ,@('06-upload.js', 1093, 1487)

  ,@('06b-ui-utils.js', 1488, 1837)

  ,@('06c-dashboard-helpers.js', 1838, 2471)

  ,@('07-depth.js', 2472, 2843)

  ,@('08-dashboard.js', 2844, 3303)

  ,@('09-table.js', 3304, 4072)

  ,@('10-formulas-ui.js', 4073, 4334)

  ,@('11-rules-ui.js', 4335, 4647)

  ,@('11-constants-ui.js', 4648, 4820)

  ,@('11-rules-bootstrap.js', 4821, 5121)

  ,@('12-app-settings.js', 5122, 5455)

  ,@('13-changelog.js', 5456, 5507)

)

New-Item -ItemType Directory -Force -Path $partsDir | Out-Null

$written = [System.Collections.Generic.HashSet[string]]::new()

foreach ($c in $chunks) {

  $name, $start, $end = $c

  $slice = $lines[($start - 1)..($end - 1)] -join "`n"

  $header = "// ui-parts/$name — slice of ui.monolith.bak.js L$start-$end`n"

  [IO.File]::WriteAllText((Join-Path $partsDir $name), $header + $slice + "`n", [Text.UTF8Encoding]::new($false))

  [void]$written.Add($name)

  Write-Host "wrote ui-parts/$name ($($end - $start + 1) lines)"

}

Get-ChildItem $partsDir -Filter '*.js' | ForEach-Object {

  if (-not $written.Contains($_.Name)) {

    Remove-Item -LiteralPath $_.FullName -Force

    Write-Host "removed stale ui-parts/$($_.Name)"

  }

}

Write-Host "`nNext: node tools/build-ui.mjs"

