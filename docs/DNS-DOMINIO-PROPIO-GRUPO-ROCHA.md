# DNS dominio propio - Distribuidora Lopez

Fecha: 2026-08-10

## Problema detectado

Algunos dispositivos o redes no resuelven correctamente:

`distribuidora-lopez.216-128-169-34.sslip.io`

El error visible en Chrome es:

`ERR_NAME_NOT_RESOLVED`

Esto indica problema de DNS/resolucion de nombre, no caida del ERP.

## Estado del servidor

El servidor Vultr responde internamente:

- IP: `216.128.169.34`
- ERP local: `127.0.0.1:8790`
- Publicacion: Caddy en puertos `80/443`
- Servicio: `distribuidora-lopez.service`

Caddy ya esta preparado para aceptar:

- `lopez.gruporochaapp.com`
- `distribuidora.gruporochaapp.com`
- `distribuidora-lopez.216-128-169-34.sslip.io`

## DNS configurado

El dominio `gruporochaapp.com` se administra desde Squarespace DNS.

Registros personalizados cargados el 2026-08-10:

### Registro principal

- Tipo: `A`
- Nombre: `lopez`
- Valor IPv4: `216.128.169.34`
- TTL: `14400` (valor disponible por defecto en Squarespace)

### Registro alternativo opcional

- Tipo: `A`
- Nombre: `distribuidora`
- Valor IPv4: `216.128.169.34`
- TTL: `14400` (valor disponible por defecto en Squarespace)

## Ajuste aplicado en Caddy

Se reconstruyo `/etc/caddy/Caddyfile` en el servidor Vultr y se dejo Caddy administrado por `systemd`:

- Servicio: `caddy.service`
- Estado esperado: `active` y `enabled`
- Proceso valido: `/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile --adapter caddyfile`

Tambien se detuvo el contenedor Docker viejo `caddy:2-alpine`, que estaba compitiendo por los puertos `80/443`.

## URL final recomendada

https://lopez.gruporochaapp.com/index.html#dashboard

## Verificacion

Desde Windows:

```powershell
Resolve-DnsName lopez.gruporochaapp.com
Invoke-WebRequest https://lopez.gruporochaapp.com/api/health -UseBasicParsing
```

Verificacion realizada:

- `https://lopez.gruporochaapp.com/api/health` -> `200`
- `https://distribuidora.gruporochaapp.com/api/health` -> `200`
- `https://wifi.gruporochaapp.com/` -> `200`
- `https://saas.gruporochaapp.com/` -> `200`

Desde Android:

Abrir en Chrome:

`https://lopez.gruporochaapp.com/api/health`

Debe mostrar JSON con `"ok": true`.

## Nota operativa

`sslip.io` queda como herramienta temporal de pruebas. Para cliente y APK final se recomienda usar siempre dominio propio.
