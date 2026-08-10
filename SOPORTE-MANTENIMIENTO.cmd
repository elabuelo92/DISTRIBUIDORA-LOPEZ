@echo off
setlocal
cd /d "%~dp0"
node .\scripts\support-maintenance.js menu
echo.
pause
