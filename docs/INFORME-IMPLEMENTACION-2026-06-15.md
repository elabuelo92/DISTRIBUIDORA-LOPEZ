# Informe de implementacion - Distribuidora Lopez

Fecha: 2026-06-15

## Estado actual

- Carpeta instalada en esta PC: `C:\DistribuidoraLopez`
- Servidor local: Node.js sobre puerto `8789`
- URL local dashboard: `http://localhost:8789/index.html#dashboard`
- URL LAN dashboard: `http://192.168.88.3:8789/index.html#dashboard`
- URL LAN preventa: `http://192.168.88.3:8789/index.html#preventa`
- IP Tailscale de esta PC: `100.116.67.7`
- URL Tailscale preventa: `http://100.116.67.7:8789/index.html#preventa`
- URL Tailscale dashboard: `http://100.116.67.7:8789/index.html#dashboard`

## Correccion aplicada

El servidor rechazaba las credenciales documentadas porque `data\users.json` tenia hashes generados con otra clave. Se agrego `scripts\reset-demo-users.js` y se regeneraron los usuarios con:

```powershell
node .\scripts\reset-demo-users.js "Lopez2026!"
```

Validacion realizada:

- `admin1 / Lopez2026!`: login API correcto.
- `sofia / Lopez2026!`: login API correcto.
- `index.html`: responde correctamente en `localhost:8789`.

## Credenciales iniciales

Administracion:

```text
Usuario: admin1
Clave: Lopez2026!
```

Vendedor:

```text
Usuario: sofia
Clave: Lopez2026!
```

Para uso productivo, cambiar `DL_DEFAULT_PASSWORD` y regenerar `data\users.json` antes de entregar claves reales.

## Ejecucion como ejecutable en Windows

Se agrego el lanzador:

```text
C:\DistribuidoraLopez\DistribuidoraLopezCRM.cmd
```

Uso manual:

1. Abrir `C:\DistribuidoraLopez`.
2. Doble clic en `DistribuidoraLopezCRM.cmd`.
3. Dejar la ventana abierta mientras se usa el sistema.
4. Abrir `http://localhost:8789/index.html#dashboard`.

Uso automatico recomendado:

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-startup-task.ps1
```

La tarea programada `DistribuidoraLopezCRM` levanta el servidor al iniciar Windows.

## Instalacion en la mini PC

1. Crear carpeta:

```powershell
mkdir C:\DistribuidoraLopez
```

2. Descomprimir el ZIP de release directamente dentro de esa carpeta.

3. Instalar Node.js LTS oficial.

4. Abrir PowerShell como administrador:

```powershell
cd C:\DistribuidoraLopez
powershell.exe -ExecutionPolicy Bypass -File .\scripts\preflight-windows.ps1
powershell.exe -ExecutionPolicy Bypass -File .\scripts\open-firewall.ps1
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-startup-task.ps1
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backup-task.ps1
```

5. Probar:

```text
http://localhost:8789/index.html#dashboard
http://192.168.88.3:8789/index.html#dashboard
```

## Conexion externa con Tailscale

En la PC servidor:

1. Verificar que Tailscale este conectado.
2. Confirmar IP Tailscale:

```powershell
tailscale ip -4
```

En esta PC la IP detectada es:

```text
100.116.67.7
```

En el celular:

1. Instalar Tailscale desde Play Store.
2. Iniciar sesion con la misma cuenta/red autorizada.
3. Confirmar que el celular aparece como conectado en Tailscale.
4. Abrir desde navegador:

```text
http://100.116.67.7:8789/index.html#preventa
```

5. Ingresar con:

```text
Usuario: sofia
Clave: Lopez2026!
```

Si abre desde WiFi local pero no desde datos moviles, revisar:

- Tailscale activo en PC y celular.
- Windows Firewall permitiendo TCP `8789`.
- Que la PC no este suspendida.
- Que el servidor siga levantado.

## APK Android

APK LAN actual:

```text
C:\DistribuidoraLopez\android-apk\out\DL-Preventa-MINI-192-168-88-3.apk
```

La APK actual apunta a:

```text
http://192.168.88.3:8789/index.html?apk=mini-pc-192-168-88-3#preventa
```

Para Tailscale, si se quiere una APK especifica fuera de la LAN, cambiar `APP_URL` en:

```text
android-apk\src\com\distribuidora\lopez\MainActivity.java
```

por:

```java
private static final String APP_URL = "http://100.116.67.7:8789/index.html?apk=tailscale#preventa";
```

Luego recompilar con JDK y Android SDK Build Tools. En esta PC no estan disponibles actualmente `javac`, `aapt`, `d8`, `apksigner` ni `zipalign`, por lo que no se puede recompilar una APK nueva localmente hasta instalar esas herramientas.

## Checklist final

- Servidor escuchando en `0.0.0.0:8789`.
- Login API validado para admin y vendedor.
- `data\users.json` regenerado con la clave documentada.
- Paquete de instalacion actualizado para incluir `data\users.json`.
- Tailscale instalado y con IP detectada `100.116.67.7`.
- Falta pendiente: instalar herramientas Android si se necesita APK Tailscale compilada en esta misma PC.
