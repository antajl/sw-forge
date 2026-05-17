@echo off
cd /d "%~dp0"
echo Split + build ui.js ...
node tools\run-ui-split.mjs
if errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\split-ui-parts.ps1
  if errorlevel 1 node tools\build-ui.mjs --split-only
  node tools\build-ui.mjs
)
echo.
echo Done. Look for: OK: built ui.js matches ui.monolith.bak.js
pause

