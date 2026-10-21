# Correccion local: memoria de conteos y ajustes fisicos

Estado: implementado localmente. NO desplegado. Sin acceso ni cambios a produccion durante esta preparacion.

## Alcance

- POST /api/stock/entry, acciones recordCount y reconcileCount.
- Elimina la copia JSON del estado completo y la copia de todos los pedidos para estas acciones.
- Aisla productos y colecciones modificables; conserva pedidos, cuentas y saldos sin recalcularlos.
- Conserva autorizacion administrativa, clave, motivo, control de reservas, conteos obsoletos e idempotencia por countId.
- Persiste JSON por partes con buffer acotado, fsync y reemplazo atomico. Publica la nueva cache solo despues del guardado.
- Responde con producto, conteo, ajuste y movimiento afectados. La interfaz aplica los registros por ID, sin duplicarlos; mantiene el cursor para la sincronizacion posterior.
- Incluye el nuevo modulo en la lista de archivos controlados por integridad.

## Pruebas

Ejecutar scripts/review-stock-count-fix.js con las dependencias del proyecto disponibles.
Resultado reproducible en STOCK-MEMORIA-20261021-results.json.

- Borradores no alteran el estado original antes de persistir.
- Reservas, pedidos, cuentas y otros productos intactos.
- Conteo sin ajuste no modifica stock; ajuste sin diferencia no crea movimiento.
- Reintentos simultaneos: seis solicitudes por accion, una sola aplicacion.
- Lecturas concurrentes de Administracion y vendedor; dos sesiones siguen activas.
- Rechazo de ajuste bajo reservas, clave incorrecta, rol no autorizado y conteo obsoleto.
- Respuesta HTTP de ajuste: 863 bytes en fixture.
- Fallos inyectados de escritura, fsync y rename conservan el archivo anterior; escritura parcial se completa.
- JSON equivalente byte a byte, incluidos caracteres Unicode y valores nulos.
- Regresion de stock, pedidos, devoluciones y control de concurrencia de sincronizacion.

## Memoria

Copia local existente de produccion: aproximadamente 90 MB; no se modifico.
Node local v24.16.0, limite de heap 512 MiB, tres ajustes y dos respuestas de sincronizacion comprimidas.

- Circuito anterior simulado: termina con codigo 134 por agotamiento del proceso.
- Circuito corregido: termina correctamente en 8076 ms para el lote; pico RSS 656284 KiB (aprox. 641 MiB), heap muestreado 216407504 bytes (aprox. 206 MiB).
- Respuesta de ajuste del benchmark: 1542 bytes.

Es un ensayo aislado de serializacion/persistencia y compresion, NO una prueba de carga HTTP completa ni una garantia de capacidad de produccion. El runtime productivo usa otra version de Node. La persistencia sigue siendo sincrona y puede bloquear brevemente; este cambio reduce el pico de memoria, no elimina todos los cuellos de botella.

## Antes de desplegar

1. Confirmar ventana y autorizacion; no se modifico la version publica ni se hizo push.
2. Respaldar codigo, configuracion y datos; registrar huellas y cantidades.
3. Publicar juntos server.js, app.js, stock-count-storage.js y license-engine.js; incrementar version/cache de frontend y regenerar integridad.
4. Reinicio controlado solo en ventana autorizada. No hacer pruebas de escritura sobre stock real.
5. Verificar salud, integridad, sesiones y comparacion de datos antes/despues del despliegue.
6. Observar un conteo operativo autorizado, su ajuste y el consumo de memoria. No reenviar movimientos manuales antiguos sin comprobar su persistencia.

## Limites

No cambia ingresos manuales, inventario inicial masivo, actualizaciones de productos ni otros endpoints. Esos circuitos mantienen su implementacion previa y requieren medicion propia. No se afirma que todo el ERP sea inmune a nuevos agotamientos.
