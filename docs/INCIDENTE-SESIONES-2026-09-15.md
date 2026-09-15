# Incidente de sesiones - 2026-09-15

Estado: `8790-145` desplegada en produccion y validada en salud, integridad, pedidos, sesiones de vendedores y administradores, y monitor. Navegacion administrativa manual pendiente de confirmacion del usuario.

## Evidencia

- Entre 12:17 y 14:26 UTC el monitor reinicio repetidamente `distribuidora-lopez.service` tras tres timeouts de `/api/health` (`code=000`).
- El VPS tambien reinicio a las 13:34 UTC. Las sesiones actuales viven en memoria del proceso y cada arranque las invalida.
- `NRestarts=0` no describe estos reinicios porque el monitor ejecuta `systemctl restart` de forma explicita.
- El monitor registro diez solicitudes de reinicio durante la jornada.
- De las ultimas mil entradas de auditoria consultadas, 995 fueron `GPS_UPDATED`. Los logs de sesiones y GPS ocupaban aproximadamente 688 MB y 554 MB; la base de estado, 41 MB.
- La comprobacion completa de `/api/health` tardo entre 1,6 y 1,9 segundos cuando respondio. No se observaron eventos OOM.

## Correccion preparada

- Limitar en la web las solicitudes GPS simultaneas y separar cada intento al menos cinco segundos.
- Aceptar en backend como maximo una ubicacion por sesion cada cinco segundos; los excesos reciben `200` con `throttled: true` y no escriben auditoria ni historial.
- Exponer `/api/health/live` como comprobacion liviana, independiente de migracion de estado e integridad.
- Apuntar el monitor a ese ping y exigir seis fallos consecutivos, con quince minutos de enfriamiento entre reinicios.

## Verificacion local

- `npm.cmd run test:session-stability`: 25 solicitudes GPS concurrentes, una escritura de auditoria e historial, sesion conservada y ping liviano disponible incluso durante mantenimiento.
- `npm.cmd run test:cache-update`, `test:maintenance-mode`, `test:order-share` y `test:print-label`: correctas.
- `node --check` de `server.js` y `app.js`, y `git diff --check`: correctos.
- Estas pruebas usan una instancia aislada; no equivalen a una validacion de estabilidad en produccion.

## Segunda fase: saturacion de lectura

Con `8790-144` en produccion, el monitor dejo de reiniciar el ERP durante la primera prueba, pero Node llego a 82% de CPU y `/api/health` tardo hasta 19 segundos. En una copia del estado productivo, el parseo JSON tardo 610 ms; `orderEngine.migrateState` 1088 ms, `accountEngine.migrateState` 658 ms y `eventEngine.migrateState` 229 ms. Cada `GET /api/state` ejecutaba esas migraciones antes de responder "sin cambios", aunque Administracion consulta cada 2,5 segundos.

`8790-145` evita migraciones cuando el cliente ya tiene la version actual o solicita una respuesta diferida. Conserva la aplicacion de listas programadas realmente vencidas. `/api/health` deja de migrar estado para entregar solo el diagnostico. Se corrigio tambien una referencia obsoleta en la activacion de listas programadas que dejaba la lista como "Programada" y provocaba reintentos.

Pruebas locales: rafaga GPS/sesion, respuesta de estado sin cambios, activacion programada de L3, proveedores/precios, precios comerciales, confiabilidad operativa, descuentos por producto, cache y sintaxis. Todas correctas. La lista base L2 permanece activa por regla preexistente; no se modifico esa politica.

## Resultado en produccion

- Commit de codigo: `02f6892`; version publica `8790-145`, sin mantenimiento.
- Backup frio: `/opt/distribuidora-lopez/backups/state-fastpath-v145-20260915T153540Z/data-cold.tar` (2,07 GB) y copia adicional del estado, usuarios, configuracion, integridad y unit del monitor.
- Pedidos al desplegar: 144 antes y 144 despues; 1.094 lineas, $12.506.740,97 y 224 bultos iguales; faltantes, agregados y modificados: 0.
- `/api/health` local inicial: 0,54 s; publico con vendedores conectados: 0,09 a 0,22 s. Antes de esta fase se observo una respuesta de 19 s bajo carga; son muestras operativas, no un benchmark controlado de mejora porcentual.
- El monitor quedo programado cada minuto. Hubo un timeout aislado en su primer ciclo, que se limpio en el siguiente; el contador volvio a 0 y el PID `68247` se mantuvo. No se registraron reinicios posteriores durante la observacion.
- Cinco inicios de sesion de vendedores y dos de administradores comprobados por auditoria. El primer cierre auditado fue renovacion voluntaria de login del mismo usuario, no una caida global. La navegacion administrativa especifica requiere confirmacion manual del usuario.

## Mitigacion operativa

Durante el horario productivo, si se autoriza expresamente una excepcion antes de las 18:00 ART, desactivar temporalmente solo `distribuidora-lopez-monitor.timer` con `sudo systemctl disable --now distribuidora-lopez-monitor.timer`. No reiniciar el ERP ni tocar `data`. `distribuidora-lopez.service` conserva `Restart=always` para caidas reales del proceso. Mantener vigilancia manual de salud y volver a activar el monitor tras instalar y probar la correccion.

## Despliegue controlado

1. Validar pruebas aisladas y sintaxis. Para esta jornada existe autorizacion expresa de excepcion antes de las 18:00 ART.
2. Hacer backup de `data` y snapshot de pedidos antes de intervenir.
3. Desplegar los archivos revisados y regenerar el manifiesto de integridad para `server.js` y `app.js`.
4. Reiniciar una sola vez en ventana de mantenimiento y validar `/api/health/live`, `/api/health`, licencia, integridad, login admin y vendedor, GPS, pedidos y reparto.
5. Comprobar que no hubo cambios en pedidos y que las sesiones permanecen estables mientras el monitor opera.

La correccion reduce la causa observada, pero no sustituye una futura persistencia segura de sesiones para sobrevivir a reinicios inevitables.

## Protocolo posterior preparado localmente

Tras observar que todavia puede haber un timeout bajo carga, se preparo una politica de monitor sin reinicio por fallo HTTP o memoria y un instalador sin reinicio implicito del ERP. Ver [PROTOCOLO-CONTINGENCIA-SESIONES-2026-09-15.md](PROTOCOLO-CONTINGENCIA-SESIONES-2026-09-15.md). Esto NO modifica la produccion `8790-145`. Faltan la prueba Linux aislada y un canal externo de alertas antes de activarlo sin vigilancia.
