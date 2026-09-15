# Incidente de sesiones - 2026-09-15

Estado: diagnostico en produccion; correccion implementada localmente, pendiente de despliegue.

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

## Mitigacion operativa

Durante el horario productivo, si se autoriza expresamente una excepcion antes de las 18:00 ART, desactivar temporalmente solo `distribuidora-lopez-monitor.timer` con `sudo systemctl disable --now distribuidora-lopez-monitor.timer`. No reiniciar el ERP ni tocar `data`. `distribuidora-lopez.service` conserva `Restart=always` para caidas reales del proceso. Mantener vigilancia manual de salud y volver a activar el monitor tras instalar y probar la correccion.

## Despliegue despues de las 18:00 ART

1. Validar pruebas aisladas y sintaxis.
2. Hacer backup de `data` y snapshot de pedidos antes de intervenir.
3. Desplegar los archivos revisados y regenerar el manifiesto de integridad para `server.js` y `app.js`.
4. Reiniciar una sola vez en ventana de mantenimiento y validar `/api/health/live`, `/api/health`, licencia, integridad, login admin y vendedor, GPS, pedidos y reparto.
5. Comprobar que no hubo cambios en pedidos y que las sesiones permanecen estables mientras el monitor opera.

La correccion reduce la causa observada, pero no sustituye una futura persistencia segura de sesiones para sobrevivir a reinicios inevitables.
