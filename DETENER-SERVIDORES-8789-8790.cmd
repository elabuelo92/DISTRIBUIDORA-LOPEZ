@echo off
echo Deteniendo solo procesos node.exe que escuchen en 8789 o 8790...
echo No se detiene Tailscale ni otros servicios del sistema.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(8789,8790); $stopped=@{}; foreach($port in $ports){ netstat -ano -p tcp | Select-String (':' + $port) | ForEach-Object { $parts=($_.ToString() -split '\s+') | Where-Object { $_ }; $procId=$parts[-1]; if($procId -match '^\d+$' -and $procId -ne '0' -and -not $stopped.ContainsKey($procId)){ $proc=Get-Process -Id ([int]$procId) -ErrorAction SilentlyContinue; if($proc -and $proc.ProcessName -eq 'node'){ $stopped[$procId]=$true; Write-Host ('Puerto ' + $port + ' node PID ' + $procId); Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue } elseif($proc){ Write-Host ('Puerto ' + $port + ' omitido: ' + $proc.ProcessName + ' PID ' + $procId) } } } }"
pause
