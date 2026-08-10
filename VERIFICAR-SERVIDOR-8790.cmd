@echo off
echo Verificando servidor unico 8790...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'http://localhost:8790/api/health' -UseBasicParsing -TimeoutSec 5 | Select-Object -ExpandProperty Content } catch { Write-Host 'NO RESPONDE http://localhost:8790/api/health'; exit 1 }"
pause
