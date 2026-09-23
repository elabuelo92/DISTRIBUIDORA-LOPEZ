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
