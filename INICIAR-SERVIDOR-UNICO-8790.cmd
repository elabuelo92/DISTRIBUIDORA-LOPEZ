@echo off
title Distribuidora Lopez - SERVIDOR UNICO 8790
cd /d "%~dp0"
echo.
echo ============================================================
echo  Distribuidora Lopez - SERVIDOR UNICO 8790
echo ============================================================
echo.
echo No cerrar esta ventana mientras se use el sistema.
echo.
echo PC local:
echo   http://localhost:8790/index.html#dashboard
echo.
echo Celular por Tailscale/datos moviles:
echo   http://desktop-c2c0q4v:8790/index.html#preventa
echo.
echo Diagnostico:
echo   http://desktop-c2c0q4v:8790/api/health
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\run-server-prod.ps1"
pause
