@echo off
title Reiniciar Distribuidora Lopez 8790 v89
net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Solicitando permisos de administrador...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

cd /d "%~dp0"
echo.
echo ============================================================
echo  Reinicio controlado SERVIDOR_UNICO_8790 v89
echo ============================================================
echo.
echo Cerrando solo procesos node.exe que escuchen en 8789 o 8790...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(8789,8790); $stopped=@{}; foreach($port in $ports){ netstat -ano -p tcp | Select-String (':' + $port) | ForEach-Object { $parts=($_.ToString() -split '\s+') | Where-Object { $_ }; $procId=$parts[-1]; if($procId -match '^\d+$' -and $procId -ne '0' -and -not $stopped.ContainsKey($procId)){ $proc=Get-Process -Id ([int]$procId) -ErrorAction SilentlyContinue; if($proc -and $proc.ProcessName -eq 'node'){ $stopped[$procId]=$true; Write-Host ('Puerto ' + $port + ' node PID ' + $procId); Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue } elseif($proc){ Write-Host ('Puerto ' + $port + ' omitido: ' + $proc.ProcessName + ' PID ' + $procId) } } } }"
timeout /t 2 /nobreak >nul
echo.
echo Iniciando servidor v89...
start "Distribuidora Lopez 8790 v89" powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0scripts\run-server-prod.ps1"
echo.
echo Validar en:
echo   http://127.0.0.1:8790/api/health
echo.
pause
