# Instalacion en MacBook Air - Distribuidora Lopez

Fecha: 2026-06-18.

## Objetivo

Hacer correr el servidor de Distribuidora Lopez sobre una MacBook Air, usando la Mac como PC principal de administracion y servidor para celulares.

## Que cambia respecto de Windows

En Mac no se usa `.cmd` ni PowerShell.

Se usan scripts `.sh` y, para que arranque solo al iniciar sesion, un `LaunchAgent` de macOS.

La aplicacion sigue siendo la misma:

```text
http://localhost:8790/index.html#dashboard
```

## Requisitos

- MacBook Air con macOS actualizado.
- Node.js LTS instalado.
- Carpeta del sistema copiada en la Mac.
- Misma red WiFi/LAN para probar desde celulares.
- Para GPS en iPhone fuera de `localhost`, usar URL HTTPS.

## Instalacion recomendada

1. Crear carpeta en la Mac:

```bash
mkdir -p "$HOME/DistribuidoraLopez"
```

2. Copiar y descomprimir el ZIP del sistema dentro de:

```text
/Users/TU_USUARIO/DistribuidoraLopez
```

La carpeta debe contener archivos como:

```text
server.js
index.html
app.js
scripts/
data/
icons/
```

3. Instalar Node.js LTS desde el sitio oficial.

4. Abrir Terminal y entrar a la carpeta:

```bash
cd "$HOME/DistribuidoraLopez"
```

5. Dar permisos de ejecucion:

```bash
chmod +x scripts/*.sh
chmod +x ABRIR-DASHBOARD-MAC.command
```

6. Chequear la instalacion:

```bash
./scripts/check-macos.sh
```

7. Ejecutar servidor manualmente:

```bash
./scripts/run-server-macos.sh
```

8. Abrir en la Mac:

```text
http://localhost:8790/index.html#dashboard
```

## Arranque automatico en Mac

Para que el servidor arranque cuando inicia sesion el usuario de la Mac:

```bash
cd "$HOME/DistribuidoraLopez"
chmod +x scripts/*.sh
./scripts/install-launchagent-macos.sh
```

Luego probar:

```text
http://localhost:8790/api/health
```

Para desinstalar el arranque automatico:

```bash
./scripts/uninstall-launchagent-macos.sh
```

## Acceso desde otros equipos de la red

Buscar la IP local de la Mac:

```bash
ipconfig getifaddr en0
```

Abrir desde otra PC/celular en la misma red:

```text
http://IP-DE-LA-MAC:8790/index.html#dashboard
```

Ejemplo:

```text
http://192.168.1.50:8790/index.html#dashboard
```

Si macOS pregunta por permisos de red/firewall para Node, permitir conexiones entrantes.

## iPhone / iPad como app

Para usarlo como app web en iPhone:

1. Abrir Safari.
2. Entrar a la URL del sistema.
3. Tocar Compartir.
4. Tocar `Agregar a pantalla de inicio`.
5. Nombre sugerido: `DL Preventa`.

Importante:

- Para GPS real en iPhone, la URL debe ser HTTPS, salvo `localhost`.
- Desde otro celular, una URL `http://IP:8790` puede abrir la app, pero iOS puede bloquear GPS.
- Para vendedores fuera de la red local se recomienda Cloudflare Tunnel, Tailscale Serve con HTTPS o dominio propio HTTPS.

## Tailscale en Mac

Si la Mac usa Tailscale:

1. Instalar Tailscale en la Mac.
2. Iniciar sesion con la misma cuenta/tailnet.
3. Confirmar que la Mac queda online.
4. Publicar el servicio `localhost:8790` por HTTPS usando Tailscale Serve o un tunnel equivalente.
5. Usar la URL HTTPS `.ts.net` desde iPhone.

## Impresion en Mac

La impresion directa de Stock en macOS usa el comando:

```bash
lp
```

Para que funcione:

1. Instalar la impresora desde Configuracion del Sistema > Impresoras y escaneres.
2. Imprimir una pagina de prueba desde macOS.
3. Si se usa impresora predeterminada, dejar `DL_STOCK_PRINTER_NAME` vacio.
4. Si se quiere fijar una impresora exacta, editar:

```text
scripts/run-server-macos.sh
```

Y definir:

```bash
export DL_STOCK_PRINTER_NAME="NOMBRE EXACTO DE LA IMPRESORA"
```

Para ver impresoras disponibles:

```bash
lpstat -p
lpstat -d
```

## URLs utiles

Dashboard:

```text
http://localhost:8790/index.html#dashboard
```

Preventa:

```text
http://localhost:8790/index.html#preventa
```

Estado del servidor:

```text
http://localhost:8790/api/health
```

## Credenciales demo

Administrador:

```text
admin1 / Lopez2026!
```

Vendedor:

```text
sofia / Lopez2026!
```

## Validacion final

- La Mac abre dashboard local.
- `api/health` responde `ok`.
- Un celular en la misma red abre el dashboard/preventa.
- Un usuario vendedor puede cargar pedido.
- Un usuario administrador ve el pedido y las notificaciones.
- Si se usa iPhone con GPS, probar con URL HTTPS.
