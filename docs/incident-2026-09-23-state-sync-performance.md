# 2026-09-23: lentitud de sincronizacion de estado

## Diagnostico

En produccion, `/api/health` tardo mas de 10 segundos en 3 de 5 lecturas durante el incidente. El proceso Node llego a usar 108% de CPU con 12 sesiones activas. Memoria, swap y disco tenian margen. El contador de respuestas `STATE_SYNC_BUSY` subio a 1.865 antes de la correccion.

La copia de solo lectura del estado productivo tenia unos 30 MB, 543 pedidos activos, 309 archivados, 1.262 clientes y 9.795 movimientos de stock. Con esta copia, cada `GET /api/state` completo ejecutaba sincronicamente las migraciones de pedidos y cuentas: aproximadamente 2,2 s y 1,0 s de CPU, respectivamente. El limite de sincronizaciones se comprobaba despues de esas migraciones, de modo que tambien las solicitudes rechazadas consumian CPU.

No se encontraron indicios de falta de RAM/disco ni de que el volumen del archivo de logs explicara esta demora. Los pedidos se siguieron creando durante el incidente; un timeout del navegador no demuestra que una operacion no se haya guardado.

## Correccion acotada

- Reservar el cupo de respuesta completa antes de migrar el estado. Las lecturas sin cambios siguen por su via rapida y no ocupan cupo.
- Ejecutar la migracion de lectura una sola vez por payload cargado. Si una lista de precios programada vence despues de esa lectura, se vuelve a evaluar y aplicar.
- Mantener sin cambios la proyeccion de datos por rol, las reglas de negocio de escritura y el limite de dos respuestas completas concurrentes.

La primera lectura completa de una version nueva todavia ejecuta las migraciones. Esta correccion reduce trabajo duplicado; no sustituye la futura mejora del costo de migracion, la separacion de datos historicos ni una prueba de carga con usuarios reales.

## Verificacion local

Con una copia aislada del estado real, el benchmark de Administracion midio 4.572 ms en la primera lectura y 586 ms en una lectura repetida de la misma version. El vendedor de prueba, con identidad equivalente a Axel, recibio 154 pedidos propios y ninguna cuenta administrativa; sus lecturas midieron 255 y 219 ms. Una lectura sin cambios tomo 4 ms. Estas cifras incluyen transferencia local y parseo de JSON; no son una promesa de latencia de Internet.

Pasaron `node --check server.js`, `smoke-state-sync-backpressure.js`, `smoke-full-seller-catalog.js`, `smoke-session-stability-v144.js`, `smoke-cache-update-v126.js` y `smoke-order-workflow-v114.js`.

## Despliegue y contingencia

No reiniciar ni desplegar antes de la ventana autorizada. Hacer backup de `data`, desplegar el cambio revisado, regenerar integridad si corresponde y reiniciar una sola vez. Despues, verificar salud publica y local, login, lectura de Admin y vendedor, estado de pedidos, contadores de `STATE_SYNC_BUSY`, CPU y latencias de `/api/state`. Revertir el codigo si se altera la visibilidad, aparecen errores de escritura o cae la salud. No restaurar la base ni reprocesar pedidos como parte del rollback de codigo.

Mientras haya demora, no repetir a ciegas un envio de pedido. Consultar el numero/estado antes de intentar de nuevo. Mantener una sola pestaña por dispositivo y no borrar datos locales de la app como medida de rendimiento.

## Seguimiento y ajuste de capacidad

El 23/09 se desplego el commit `1c0f49b` con backup en `/opt/distribuidora-lopez/backups/emergency-20260923-235431`. La comparacion del corte operativo con 470 pedidos, 3.285 lineas y 685 bultos dio hash identico antes y despues.

Con la copia aislada del estado real se probaron 12 sesiones simultaneas. A una consulta por segundo y un cambio de estado cada 10 segundos durante 90 segundos hubo cero errores, aunque 255 respuestas temporales `STATE_SYNC_BUSY`. A la cadencia de una consulta cada 10 segundos y un cambio cada 30 segundos durante dos minutos, el limite de dos respuestas completas produjo 60 respuestas `STATE_SYNC_BUSY`; con cuatro produjo 30, y con seis produjo 15, pero seis aumento la mediana de lectura completa. Se eligio cuatro como compromiso entre espera y latencia.

Con cuatro cupos se ejecuto una prueba sostenida de cinco minutos, 12 usuarios y 10 cambios de estado: cero errores, 102 respuestas `STATE_SYNC_BUSY`, mediana de lectura completa 877 ms, p95 5.467 ms, p95 de salud 3.431 ms. Una prueba adicional confirmo que, detenidos los cambios, las 12 sesiones alcanzaron la version final en 7,3 segundos, sin clientes rezagados. Estas respuestas ocupadas son reintentos esperados, no operaciones perdidas; aun asi, no debe prometerse ausencia total de demoras. El proximo objetivo tecnico es sincronizacion incremental para evitar enviar estado completo a cada cliente ante cada cambio.

El limite se ajusto en produccion de 2 a 4 sin modificar codigo ni datos. Backup: `/opt/distribuidora-lopez/backups/state-sync-cap-20260924-004035`. Los 470 pedidos del corte conservaron el mismo hash y no hubo faltantes, agregados ni cambios.

En la jornada del 25/09, el mismo proceso seguia activo con 10 sesiones, 618 pedidos y 41 respuestas `STATE_SYNC_BUSY` acumuladas desde el reinicio. Licencia, integridad y salud local/publica estaban correctas. Un pico de CPU de aproximadamente 105% durante una actualizacion de estado bajo a 0-3% en una segunda muestra separada; memoria y swap conservaron margen. Este seguimiento confirma continuidad operativa, pero no reemplaza una medicion de latencia autenticada con los usuarios reales en plena carga.
