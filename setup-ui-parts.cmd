@echo off

cd /d "%~dp0"

echo Splitting ui-parts from monolith and building ui.js ...

node tools\run-ui-split.mjs

if errorlevel 1 (

  node tools\build-ui.mjs --split-only

  node tools\build-ui.mjs

)

echo.

pause

