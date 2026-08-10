# Despliegue Vultr y GitHub - v88

Fecha de cierre: 2026-08-10

## Estado

El sistema quedo publicado en el servidor Vultr mediante HTTPS y respaldado en GitHub como repositorio privado.

URL operativa:

https://distribuidora-lopez.216-128-169-34.sslip.io/index.html#dashboard

Health check:

https://distribuidora-lopez.216-128-169-34.sslip.io/api/health

Repositorio:

https://github.com/elabuelo92/distribuidora-lopez-erp

## Arquitectura aplicada

- Aplicacion Node.js ejecutada por `systemd`.
- Publicacion externa por Caddy con TLS automatico.
- Node escucha en `127.0.0.1:8790`.
- Caddy publica el host HTTPS y redirige al servicio local.
- Datos persistentes separados del codigo.
- Licencia e integridad estrictas activadas.

## Rutas del servidor

- Codigo: `/opt/distribuidora-lopez/app`
- Datos: `/opt/distribuidora-lopez/data`
- Servicio: `distribuidora-lopez.service`
- Variables: `/etc/distribuidora-lopez.env`

## Validaciones realizadas

- `GET /api/health` local del servidor.
- `GET /api/health` por HTTPS publico.
- Carga de `index.html` por HTTPS.
- Carga de `config.js` apuntando a la URL HTTPS.
- Login administrativo contra la URL HTTPS.
- Cierre de sesion de prueba.
- Verificacion de cantidad de productos, pedidos y rutas.

## Seguridad

- El puerto 8790 no debe exponerse publicamente.
- La entrada publica debe ser solamente por HTTPS, puertos 80/443.
- El repositorio no incluye datos productivos, claves privadas, backups, APKs ni archivos temporales.
- No borrar la copia local hasta completar pruebas reales y confirmar backups.

## Proximo paso

Recompilar o reconfigurar las APK para que consuman:

https://distribuidora-lopez.216-128-169-34.sslip.io

Las APK antiguas pueden seguir intentando conectar contra IPs o hosts anteriores.
