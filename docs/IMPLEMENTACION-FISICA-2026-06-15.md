# Implementacion fisica - Lunes 15/06/2026

Objetivo: dejar instalada la primera version operativa en la mini PC del cliente, conectada a UPS, con acceso local, backup y base lista para pruebas reales.

## 1. Llevar preparado

- Mini PC Ryzen 3 / 16 GB / SSD 480 GB.
- Fuente de la mini PC.
- UPS.
- Cable de red.
- Teclado, mouse y monitor para instalacion.
- Pendrive o carpeta con el proyecto.
- Paquete limpio opcional: `release\DistribuidoraLopez-Semana1-2026-06-15.zip`.
- Instalador de Node.js LTS para Windows.
- APK actual: `android-apk\out\DL-Preventa.apk`.
- Credenciales demo:
  - Admin: `admin1`
  - Vendedor: `sofia`
  - Clave: `Lopez2026!`

## 2. Conexion fisica

Conectar a la UPS:

- Mini PC.
- Router/modem principal.
- Switch, si existe.

Conectar la mini PC por cable Ethernet. No usar WiFi como conexion principal del servidor.

## 3. Configuracion de Windows

- Nombre sugerido del equipo: `DL-SERVIDOR`.
- Usuario local administrador.
- Windows Update al dia, sin reinicio pendiente.
- Desactivar suspension e hibernacion.
- Configurar encendido automatico despues de corte si la BIOS lo permite.
- Configurar IP fija o reserva DHCP en el router.

Comandos utiles como administrador:

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /hibernate off
```

## 4. Instalar software base

Instalar:

- Node.js LTS.
- Google Chrome.
- Android File Transfer no hace falta; la APK se puede pasar por cable, Drive o WhatsApp.

Crear carpeta:

```powershell
C:\DistribuidoraLopez
```

Copiar todo el proyecto ahi.

Si se usa el paquete ZIP, descomprimir su contenido directamente en:

```powershell
C:\DistribuidoraLopez
```

## 5. Variables de entorno

Abrir PowerShell como administrador:

```powershell
setx /M PORT "8789"
setx /M DATA_DIR "C:\DistribuidoraLopez\data"
setx /M STATE_FILE "C:\DistribuidoraLopez\data\demo-state.json"
setx /M DL_DEFAULT_PASSWORD "CAMBIAR-CLAVE-ANTES-DE-PRODUCCION"
setx /M GOOGLE_MAPS_API_KEY "PEGAR-API-KEY"
```

Cerrar y abrir PowerShell despues de `setx`.

Para demo controlada se puede mantener la clave visible `Lopez2026!`, pero para uso real hay que cambiarla.

## 6. Diagnostico previo

Desde `C:\DistribuidoraLopez`:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\preflight-windows.ps1
```

Debe mostrar:

- Node.js OK.
- Archivos principales OK.
- IP local detectada.
- Puerto 8789 libre o escuchando.

## 7. Abrir firewall

PowerShell como administrador:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\open-firewall.ps1
```

## 8. Probar arranque manual

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\run-server-prod.ps1
```

Probar en la mini PC:

```text
http://localhost:8789/index.html#dashboard
```

Probar desde otra PC/celular en la misma red:

```text
http://IP-DEL-SERVIDOR:8789/index.html#dashboard
```

## 9. Instalar arranque automatico

PowerShell como administrador:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-startup-task.ps1
```

Esto crea la tarea programada `DistribuidoraLopezCRM` y la ejecuta al iniciar Windows.

Validar:

```powershell
Get-ScheduledTask -TaskName DistribuidoraLopezCRM
```

## 10. Backup diario

Probar backup:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\backup-windows.ps1
```

Luego crear tarea programada diaria para ejecutar ese script, idealmente al mediodia o al cierre del dia.

Instalar tarea automatica diaria:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backup-task.ps1
```

Queda programada todos los dias a las 20:00.

## 11. APK preventa

La APK local debe apuntar a la IP real del servidor. Si cambia la IP, hay que recompilar la APK.

Para prueba inicial:

- Instalar `android-apk\out\DL-Preventa.apk`.
- Abrir APK.
- Ingresar:
  - Usuario: `sofia`
  - Clave: `Lopez2026!`
- Cargar pedido de prueba.
- Activar GPS.
- Verificar en dashboard que el pedido y ubicacion aparecen.

## 12. Acceso desde la calle

Para que funcione fuera del WiFi, configurar una de estas opciones:

- Recomendada: Cloudflare Tunnel con URL HTTPS.
- Alternativa: Tailscale en servidor y celulares.

No alcanza con que la mini PC este encendida si el celular esta en datos moviles y la APK apunta a una IP local `192.168.x.x`.

## 13. Prueba de aceptacion del lunes

La instalacion queda aceptada si se cumplen estos puntos:

- Dashboard abre desde la mini PC.
- Dashboard abre desde otra PC/celular en la red.
- Login admin funciona.
- Login vendedor funciona.
- Vendedor solo ve preventa.
- Pedido cargado desde celular aparece en pedidos.
- Stock valida cantidades.
- GPS del vendedor aparece en dashboard.
- Backup genera archivo zip.
- Reinicio de Windows levanta el sistema automaticamente.

## 14. Pendientes posteriores

- URL publica HTTPS.
- Recompilar APK con URL publica.
- Importar clientes reales.
- Importar productos y stock inicial.
- Definir usuarios finales por persona.
- Migrar a base de datos real cuando termine la etapa demo-controlada.
