# Version 8790-100 - Correccion urgente de rendimiento

Fecha de intervencion: 2026-08-19.

## Incidente

La aplicacion presentaba demoras de 5 a 12 segundos y fallas intermitentes de acceso. Caddy y el servidor seguian activos, pero el proceso Node quedaba temporalmente bloqueado.

## Causa confirmada

Cada posicion GPS se anexaba correctamente a `gps-history.log`, pero un muestreo aleatorio ejecutaba `pruneGpsHistory()` dentro de la misma solicitud. Esa funcion leia, separaba, filtraba y reescribia sincronicamente todo el historial. En produccion el archivo habia alcanzado 96 MB, por lo que el event loop de Node dejaba de atender logins, API y pantallas mientras se realizaba la poda.

Mediciones previas:

- `/api/health` local: timeout superior a 12 segundos.
- Memoria del servicio: aproximadamente 884 MB.
- `demo-state.json`: 37 MB.
- `gps-history.log`: 96 MB.
- `session-audit.log`: 116 MB.

## Correccion

- Se elimino la poda sincrona aleatoria del flujo de recepcion GPS.
- El registro historico GPS continua activo y no se elimina informacion.
- La limpieza o rotacion de historiales debe ejecutarse como mantenimiento programado, fuera del procesamiento de solicitudes.
- Se incremento la version visible y el cache de la aplicacion a `8790-100`.

## Recuperacion inmediata

Se reinicio controladamente `distribuidora-lopez.service`. Luego del reinicio:

- memoria inicial aproximada: 218 MB;
- `/api/health`: 0,29 segundos luego del calentamiento;
- Caddy: activo.

## Validacion requerida de despliegue

1. Backup de `/opt/distribuidora-lopez/data`.
2. Actualizacion desde `main`.
3. Verificacion de sintaxis.
4. Regeneracion del manifiesto de integridad.
5. Reinicio controlado.
6. Validacion de health, login, estado, version, licencia e integridad.
7. Serie de mediciones de latencia y verificacion desde la URL publica.

## Refuerzo 8790-101

La revision posterior detecto que el estado productivo alcanzaba 36,8 MB, de los cuales 24,6 MB correspondian a auditoria global. `sendJson()` comprimia ese volumen con `gzipSync`, bloqueando el event loop durante cada sincronizacion grande.

Se aplicaron dos refuerzos:

- compresion gzip/deflate asincrona para que las respuestas grandes no bloqueen logins, GPS ni otras solicitudes;
- vendedores y repartidores ya no reciben colecciones administrativas pesadas como auditoria global, eventos de dominio, outbox, homologaciones o GPS rechazados. El historial original permanece completo en el servidor.

## Refuerzo 8790-102

La edicion administrativa de pedidos todavia respondia con el estado completo. En navegadores con timeout de 12 segundos esto producia `signal is aborted without reason` aunque la operacion hubiera llegado al servidor.

- `/api/orders/:code/edit` ahora persiste y audita normalmente, pero devuelve una respuesta compacta con el pedido actualizado.
- La interfaz reemplaza solamente el pedido modificado y cierra el dialogo sin descargar nuevamente todo el ERP.
- El estado inicial administrativo limita las colecciones historicas enviadas en la sincronizacion general. Los registros completos no se borran del archivo productivo.
