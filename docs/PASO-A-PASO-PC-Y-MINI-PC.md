# Paso a paso - prueba en esta PC y carga en mini PC

Fecha: 2026-06-13

## Datos actuales para probar en esta PC

- IP actual de esta PC: `192.168.100.9`
- Puerto del sistema: `8789`
- Dashboard desde esta PC: `http://localhost:8789/index.html#dashboard`
- Dashboard desde otro equipo/celular en el mismo WiFi: `http://192.168.100.9:8789/index.html#dashboard`
- Preventa desde navegador del celular: `http://192.168.100.9:8789/index.html#preventa`
- APK compilada para esta PC: `android-apk\out\DL-Preventa.apk`
- APK con nombre identificable: `android-apk\out\DL-Preventa-PC-192-168-100-9.apk`

Credenciales demo:

- Admin: `admin1`
- Vendedor: `sofia`
- Clave: `Lopez2026!`

## Escenario A - Probar primero sobre esta PC

### 1. Abrir la carpeta del proyecto

Carpeta:

```text
C:\Users\Carolina Naselli\Documents\Codex\2026-06-03\debemos-programar-una-app-para-desarrollo
```

### 2. Iniciar el servidor local

Opcion simple:

```text
Doble click en run-demo-server.cmd
```

Dejar esa ventana abierta mientras se prueba el sistema.

Opcion PowerShell:

```powershell
.\DemoServer.exe
```

### 3. Abrir dashboard en esta PC

En Chrome:

```text
http://localhost:8789/index.html#dashboard
```

Ingresar:

```text
Usuario: admin1
Clave: Lopez2026!
```

### 4. Abrir desde el celular usando navegador

El celular debe estar en el mismo WiFi que esta PC.

Abrir en Chrome del celular:

```text
http://192.168.100.9:8789/index.html#preventa
```

Ingresar:

```text
Usuario: sofia
Clave: Lopez2026!
```

### 5. Si el celular no conecta

Abrir PowerShell como administrador en esta PC y ejecutar:

```powershell
cd "C:\Users\Carolina Naselli\Documents\Codex\2026-06-03\debemos-programar-una-app-para-desarrollo"
powershell.exe -ExecutionPolicy Bypass -File .\scripts\open-firewall.ps1
```

Despues volver a probar:

```text
http://192.168.100.9:8789/index.html#preventa
```

### 6. Pasar APK al telefono

Archivo:

```text
android-apk\out\DL-Preventa.apk
```

O copia identificada:

```text
android-apk\out\DL-Preventa-PC-192-168-100-9.apk
```

Formas de pasarlo:

- Cable USB.
- Google Drive.
- WhatsApp.
- Telegram.
- Email.

En Android, si pide permiso:

- Permitir instalar apps de origen desconocido para la app desde donde se abre el APK.
- Si ya habia una version anterior y no instala, desinstalar `DL Preventa` e instalar de nuevo.

### 7. Prueba basica desde APK

1. Abrir `DL Preventa`.
2. Ingresar usuario `sofia`.
3. Clave `Lopez2026!`.
4. Cargar cantidades en productos.
5. Enviar pedido.
6. Activar GPS.
7. En la PC, entrar al dashboard y verificar:
   - Pedido recibido.
   - Stock modificado.
   - Vendedor con comision.
   - Ubicacion/GPS.

## Escenario B - Cargar programa en la mini PC

Mini PC definitiva:

```text
IP fija: 192.168.88.3
Dashboard: http://192.168.88.3:8789/index.html#dashboard
Preventa: http://192.168.88.3:8789/index.html#preventa
APK: android-apk\out\DL-Preventa-MINI-192-168-88-3.apk
```

### 1. Copiar paquete a la mini PC

Paquete:

```text
release\DistribuidoraLopez-Semana1-2026-06-15.zip
```

En la mini PC crear:

```powershell
C:\DistribuidoraLopez
```

Descomprimir el ZIP dentro de esa carpeta.

### 2. Conexion fisica

Conectar a UPS:

- Mini PC.
- Router/modem.
- Switch, si existe.

Conectar la mini PC por cable de red. No usar WiFi como conexion principal del servidor.

### 3. Instalar base Windows

Instalar:

- Node.js LTS oficial.
- Google Chrome.

Desactivar suspension:

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /hibernate off
```

### 4. Configurar variables de entorno

Abrir PowerShell como administrador:

```powershell
setx /M PORT "8789"
setx /M DATA_DIR "C:\DistribuidoraLopez\data"
setx /M STATE_FILE "C:\DistribuidoraLopez\data\demo-state.json"
setx /M DL_DEFAULT_PASSWORD "CAMBIAR-CLAVE-ANTES-DE-PRODUCCION"
setx /M GOOGLE_MAPS_API_KEY "PEGAR-API-KEY"
```

Cerrar y abrir PowerShell despues de esto.

### 5. Diagnosticar mini PC

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\preflight-windows.ps1
```

Tiene que mostrar:

- Node.js OK.
- Archivos OK.
- IP local de la mini PC.
- Puerto 8789 libre o escuchando.

Anotar la IP de la mini PC. Ejemplo:

```text
192.168.100.50
```

### 6. Abrir firewall en mini PC

PowerShell como administrador:

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\open-firewall.ps1
```

### 7. Probar servidor manual

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\run-server-prod.ps1
```

Abrir en la mini PC:

```text
http://localhost:8789/index.html#dashboard
```

Desde otra PC/celular en el mismo WiFi:

```text
http://IP-DE-LA-MINI-PC:8789/index.html#dashboard
```

### 8. Instalar arranque automatico

PowerShell como administrador:

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-startup-task.ps1
```

Validar:

```powershell
Get-ScheduledTask -TaskName DistribuidoraLopezCRM
```

### 9. Instalar backup automatico

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backup-task.ps1
```

Probar backup:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\backup-windows.ps1
```

### 10. APK para mini PC

Importante:

La APK generada hoy apunta a esta PC:

```text
http://192.168.100.9:8789
```

Cuando la mini PC quede instalada, si su IP es distinta, esa APK no va a conectar contra la mini PC.

Para probar inmediatamente en la mini PC sin recompilar APK, usar navegador del celular:

```text
http://IP-DE-LA-MINI-PC:8789/index.html#preventa
```

La APK ya fue recompilada para `192.168.88.3`. Si mas adelante se cambia la IP o se usa URL publica HTTPS, hay que recompilarla de nuevo.

### 11. Prueba final en mini PC

1. Reiniciar la mini PC.
2. Esperar 1 minuto.
3. Abrir:

```text
http://localhost:8789/index.html#dashboard
```

4. Desde celular en WiFi abrir:

```text
http://IP-DE-LA-MINI-PC:8789/index.html#preventa
```

5. Login vendedor.
6. Cargar pedido.
7. Ver pedido en dashboard.
8. Probar backup.

## Escenario C - Vendedores desde la calle

Para que los vendedores entren desde datos moviles, no sirve la IP local `192.168.x.x`.

Opciones:

- Cloudflare Tunnel con URL HTTPS publica.
- Tailscale en mini PC y celulares.

Cuando haya URL publica, la APK se recompila con esa URL:

```text
https://url-publica/index.html#preventa
```
