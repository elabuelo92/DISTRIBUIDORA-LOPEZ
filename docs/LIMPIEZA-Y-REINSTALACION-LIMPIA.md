# Limpieza y reinstalacion limpia

Objetivo: dejar una sola copia activa de Distribuidora Lopez, evitar procesos viejos y asegurar que PC y celular lean/escriban el mismo `data`.

## 1. Desactivar antes de borrar

Ejecutar PowerShell como administrador.

Detener servidor Node que use el puerto 8789:

```powershell
netstat -ano -p tcp | findstr :8789
Stop-Process -Id PID_ENCONTRADO -Force
```

Detener tareas programadas del sistema:

```powershell
Stop-ScheduledTask -TaskName DistribuidoraLopezCRM -ErrorAction SilentlyContinue
Stop-ScheduledTask -TaskName DistribuidoraLopezBackup -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName DistribuidoraLopezCRM -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName DistribuidoraLopezBackup -Confirm:$false -ErrorAction SilentlyContinue
```

Cerrar ventanas abiertas de:

- `DistribuidoraLopezCRM.cmd`
- `run-server-prod.ps1`
- `npm start`
- `node server.js`
- `DemoServer.exe`
- PowerShell que haya quedado ejecutando el servidor

## 2. Borrar basura residual

Despues de detener procesos, borrar copias viejas o carpetas de staging:

```powershell
Remove-Item C:\DistribuidoraLopez\App156 -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item C:\DistribuidoraLopez\release\DistribuidoraLopez -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item C:\DistribuidoraLopez\release\DistribuidoraLopez-Semana1-2026-06-15 -Recurse -Force -ErrorAction SilentlyContinue
```

Si se va a reinstalar desde cero, tambien borrar el contenido viejo de `C:\DistribuidoraLopez`, dejando solamente el ZIP nuevo en otra ubicacion temporal antes de descomprimir.

## 3. Instalar limpio

1. Crear carpeta:

```powershell
mkdir C:\DistribuidoraLopez
```

2. Descomprimir el ZIP limpio directamente dentro de:

```text
C:\DistribuidoraLopez
```

La carpeta final debe contener directamente:

- `server.js`
- `app.js`
- `index.html`
- `scripts`
- `data`
- `android-apk`
- `DistribuidoraLopezCRM.cmd`

No debe quedar:

- `C:\DistribuidoraLopez\App156`
- `C:\DistribuidoraLopez\release\DistribuidoraLopez`
- `C:\DistribuidoraLopez\release\DistribuidoraLopez-Semana1-2026-06-15`

## 4. Levantar servidor

PowerShell como administrador:

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\open-firewall.ps1
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-startup-task.ps1
```

Validar:

```powershell
netstat -ano -p tcp | findstr :8789
```

Debe mostrar:

```text
0.0.0.0:8789 LISTENING
```

## 5. Validar misma base de datos

Desde la PC:

```text
http://localhost:8789/index.html#dashboard
```

Desde celular LAN:

```text
http://192.168.88.3:8789/index.html#preventa
```

Desde celular por Tailscale:

```text
http://100.116.67.7:8789/index.html#preventa
```

Los datos se guardan en:

```text
C:\DistribuidoraLopez\data\demo-state.json
```

Si ese archivo cambia al cargar pedidos desde el celular, PC y celular estan usando el mismo servidor.
