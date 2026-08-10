# Ajuste GPS, HTTPS y permisos - 2026-06-16

## Diagnostico

En el telefono se vio este mensaje:

```text
GPS sin permiso: Only secure origins are allowed
```

Ese mensaje no significa solamente que falte activar un permiso del celular. Chrome en Android bloquea la geolocalizacion del navegador cuando la pagina se abre desde una URL HTTP remota, por ejemplo:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

Con esa URL el sistema puede cargar y sincronizar datos, pero el navegador no entrega GPS real. Para GPS real desde navegador se necesita HTTPS o localhost. En el telefono no es localhost, entonces la alternativa correcta es HTTPS por Tailscale Serve o la APK con permisos nativos.

## Correccion aplicada en el sistema

Version frontend:

```text
8790-9
```

Cambios aplicados:

- La app detecta si el navegador esta en una URL insegura antes de pedir GPS.
- Si el origen es HTTP remoto, muestra un mensaje claro: abrir por HTTPS o usar APK.
- La ubicacion demo ya no cae en Buenos Aires; el boton ahora dice `Demo Cordoba`.
- El estado central quedo sin ubicaciones demo guardadas.
- Los rótulos distinguen `GPS real navegador`, `GPS real nativo` y `Ubicacion DEMO Cordoba`.

## Que activar en el telefono

En Android:

1. Activar `Ubicacion` general del telefono.
2. Ir a `Ajustes > Aplicaciones > Chrome > Permisos > Ubicacion`.
3. Permitir ubicacion para Chrome.
4. Activar ubicacion precisa si Android lo ofrece.
5. En Chrome, entrar al candado/advertencia del sitio y revisar `Configuracion del sitio > Ubicacion`.

Importante: aunque estos permisos esten bien, Chrome seguira bloqueando GPS si la URL es HTTP remota.

## URL para navegar sin GPS real

Sirve para probar carga, clientes, productos, pedidos y sincronizacion:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
http://desktop-c2c0q4v:8790/api/health
```

## URL requerida para GPS real desde Chrome Android

Cuando Tailscale Serve HTTPS quede activo, usar:

```text
https://desktop-c2c0q4v.tail6f19de.ts.net/index.html#preventa
https://desktop-c2c0q4v.tail6f19de.ts.net/api/health
```

No agregar `:8790` en la URL HTTPS si Tailscale Serve queda publicado en el puerto 443.

## Comando recomendado para activar HTTPS por Tailscale

Estado verificado en esta PC:

```text
http://desktop-c2c0q4v:8790
http://desktop-c2c0q4v.tail6f19de.ts.net:8790
```

Ese estado es HTTP solamente. Todavia no habilita GPS real en Chrome Android.

Abrir PowerShell como administrador y ejecutar:

```powershell
tailscale serve --bg --yes --https=443 http://127.0.0.1:8790
```

Desde Codex se intento ejecutar ese comando, pero la CLI de Tailscale quedo sin responder y se corto por tiempo. Por eso queda como accion manual desde PowerShell administrador.

Luego probar en el telefono:

```text
https://desktop-c2c0q4v.tail6f19de.ts.net/api/health
```

Si no responde, revisar:

- Que Tailscale este conectado en la PC.
- Que Tailscale este conectado en el telefono.
- Que MagicDNS/HTTPS este habilitado en Tailscale.
- Que el panel admin de Tailscale permita certificados HTTPS para el tailnet.
- Que el servidor local siga corriendo en `127.0.0.1:8790`.

## Limpieza si aparece la ubicacion vieja de Buenos Aires

La ubicacion vieja venia de una simulacion/demo previa. El archivo central ya quedo limpio, pero Chrome puede conservar estado local.

En PC:

```text
C:\DLPreventaServer\ABRIR-LIMPIAR-NAVEGADOR.cmd
```

En el telefono:

1. Cerrar la pestana vieja.
2. Borrar cache/datos del sitio en Chrome.
3. Abrir nuevamente la URL vigente.
4. No tocar `Demo Cordoba` salvo que se quiera probar una ubicacion simulada.

## Decision operativa

Para el piloto:

- Usar HTTP por Tailscale para sincronizacion basica.
- Usar HTTPS por Tailscale o APK para GPS real.
- No interpretar coordenadas demo como ubicacion del vendedor.
