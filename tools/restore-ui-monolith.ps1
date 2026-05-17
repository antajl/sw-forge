# Restore working single-file UI + fix index.html script tags
$root = Split-Path -Parent $PSScriptRoot
Copy-Item -Force (Join-Path $root 'js\ui.monolith.bak.js') (Join-Path $root 'js\ui.js')
$html = Get-Content (Join-Path $root 'index.html') -Raw
$html = $html -replace '(?s)(\s*<script src="js/swrm-motion\.js"></script>)\s*\n\s*<script src="js/ui/context\.js"></script>\s*\n\s*<script src="js/ui/shell\.js"></script>\s*\n\s*<script src="js/ui\.js"></script>', "`$1`n  <script src=`"js/ui.js`"></script>"
if ($html -notmatch 'js/ui\.js') {
  Write-Warning 'index.html: check script tags manually'
} else {
  Set-Content (Join-Path $root 'index.html') $html -NoNewline
}
Write-Host 'Restored js/ui.js from backup and fixed index.html (single ui.js only).'
