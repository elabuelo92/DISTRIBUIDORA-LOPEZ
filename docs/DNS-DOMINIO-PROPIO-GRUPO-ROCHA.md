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

## DNS requerido

El dominio `gruporochaapp.com` usa Google Cloud DNS.

Crear estos registros:

### Registro principal

- Tipo: `A`
- Nombre: `lopez`
- Valor IPv4: `216.128.169.34`
- TTL: `300`

### Registro alternativo opcional

- Tipo: `A`
- Nombre: `distribuidora`
- Valor IPv4: `216.128.169.34`
- TTL: `300`

## URL final recomendada

https://lopez.gruporochaapp.com/index.html#dashboard

## Verificacion

Desde Windows:

```powershell
Resolve-DnsName lopez.gruporochaapp.com
Invoke-WebRequest https://lopez.gruporochaapp.com/api/health -UseBasicParsing
```

Desde Android:

Abrir en Chrome:

`https://lopez.gruporochaapp.com/api/health`

Debe mostrar JSON con `"ok": true`.

## Nota operativa

`sslip.io` queda como herramienta temporal de pruebas. Para cliente y APK final se recomienda usar siempre dominio propio.
