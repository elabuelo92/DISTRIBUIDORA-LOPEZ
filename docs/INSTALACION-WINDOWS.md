# Instalacion en servidor Windows

Esta guia deja el sistema corriendo en la oficina del cliente y accesible desde celulares fuera de la red.

## 1. Preparar servidor

Requisitos:

- Windows 10/11 Pro o Windows Server.
- UPS conectada.
- IP fija local o reserva DHCP.
- Node.js LTS instalado.
- Puerto local sugerido: `8789`.

Carpeta recomendada:

```powershell
C:\DistribuidoraLopez
```

Copiar ahi todo el proyecto.

## 2. Variables de entorno

Configurar:

```powershell
setx /M PORT "8789"
setx /M DATA_DIR "C:\DistribuidoraLopez\data"
setx /M STATE_FILE "C:\DistribuidoraLopez\data\demo-state.json"
setx /M DL_DEFAULT_PASSWORD "cambiar-esta-clave"
setx /M GOOGLE_MAPS_API_KEY "api-key-de-google-maps"
```

Cerrar y abrir la terminal despues de usar `setx`.

## 3. Primer arranque

Desde la carpeta del proyecto:

```powershell
npm start
```

Probar:

```text
http://localhost:8789/index.html#dashboard
```

Luego desde otra PC de la misma red:

```text
http://IP-DEL-SERVIDOR:8789/index.html#dashboard
```

## 4. Firewall

Permitir entrada TCP al puerto `8789`.

```powershell
New-NetFirewallRule -DisplayName "Distribuidora Lopez CRM" -Direction Inbound -Protocol TCP -LocalPort 8789 -Action Allow
```

## 5. Acceso remoto

Para vendedores en la calle, no usar IP `192.168.x.x`. Opciones:

- Recomendada: Cloudflare Tunnel con URL HTTPS estable.
- Alternativa: Tailscale VPN en servidor y celulares.
- Alternativa avanzada: dominio propio con reverse proxy.

La APK debe apuntar a la URL final:

```java
private static final String APP_URL = "https://crm.distribuidoralocal.com/index.html#preventa";
```

## 6. Arranque automatico con Windows

Para esta primera implementacion, usar tarea programada al iniciar Windows. Es mas estable y simple que intentar correr PowerShell como servicio nativo.

Ejecutar PowerShell como administrador:

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\DistribuidoraLopez\scripts\install-startup-task.ps1
```

Para quitarlo:

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\DistribuidoraLopez\scripts\uninstall-startup-task.ps1
```

## 7. Backup

Crear una tarea diaria que ejecute:

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\DistribuidoraLopez\scripts\backup-windows.ps1
```

Guardar copia externa semanal en pendrive, NAS o nube.

## 8. Guia de campo

Para la instalacion fisica del lunes usar:

```text
docs\IMPLEMENTACION-FISICA-2026-06-15.md
```
