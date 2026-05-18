@echo off
cd /d "%~dp0"
echo === SW Rune Master: structure migration ===
node tools\migrate-structure.mjs
if errorlevel 1 (
  echo Migration failed.
  pause
  exit /b 1
)
echo.
echo === Rebuild UI bundle ===
node tools\build-ui.mjs
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)
node --check js\ui.js
if errorlevel 1 (
  echo Syntax check failed.
  pause
  exit /b 1
)
echo.
echo Done. Open the site and hard-refresh (Ctrl+F5).
pause
