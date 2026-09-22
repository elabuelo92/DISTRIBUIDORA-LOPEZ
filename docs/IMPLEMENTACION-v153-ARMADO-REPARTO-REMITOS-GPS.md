# Version 8790-153 - Armado, Reparto, remitos y GPS

Estado al 22/09/2026: implementado y probado localmente. No se modifico produccion en esta tanda.

## Alcance

- El rol `depot` abre exclusivamente Armado. La API limita sus operaciones a estado de Armado, etiquetas, escaneo, avances permitidos y presencia. Se mantiene el usuario existente `deposito1`; no se cambia su clave.
- El repartidor que tomo una ruta puede elegir cualquier parada pendiente y usar el flujo actual de visita, cobranza, entrega o incidencia. No necesita postergar paradas anteriores. La secuencia sigue siendo sugerida; los controles de dispositivo, GPS y estado permanecen.
- En la validacion administrativa de un remito se puede corregir producto o cantidad de una linea y agregar un producto ya existente en catalogo. Las correcciones requieren observacion, quedan auditadas y el stock se aplica una sola vez. No se habilita crear un SKU nuevo desde esta pantalla.
- Los recorridos GPS agrupan los identificadores de app y servicio nativo que comparten sesion, conservan la lista de fuentes, usan `America/Argentina/Buenos_Aires` y toman el horario configurado si no se envia un rango. Dos telefonos fisicos distintos siguen apareciendo por separado.

## Verificacion local

- Benchmark aislado con el codigo v153 (`scripts/benchmark-100-orders-v127.js`):
  - 100 pedidos: estado 231.2 ms (3.85 MB), Clientes 16.8 ms, Planificacion 73.4 ms, reordenamiento 55.3 ms y publicacion 181.4 ms.
  - 200 pedidos: estado 372.8 ms (4.47 MB), Planificacion 105.1 ms y publicacion 244.8 ms.
  - La prueba cubre API y estado en una maquina local; no mide renderizado movil ni red de cada usuario y no justifica afirmar una mejora porcentual frente a v152.
- Backpressure de sincronizacion: 12 consultas simultaneas, 1 respuesta de estado aceptada y 11 respuestas de servidor ocupado; `/api/health/live` permanecio responsive.
- `npm run test:delivery-operations`: 60 pedidos, entrega e incidencia fuera de secuencia.
- `npm run test:delivery-driver-ux`: lista de 100 y eleccion directa de una parada posterior.
- `npm run test:remit-reconcile`: reemplazo, agregado, cantidades, stock, replay idempotente, GPS historico y permisos `depot`.
- `npm run test:session-stability`, `npm run test:order-workflow`, `npm run test:delivery-planner`, `npm run test:pending-revisions`, `npm run test:cache-update`.
- `node --check server.js`, `node --check app.js`, `git diff --check`.

## Linea base productiva previa

Lectura sin cambios del 22/09/2026: version 8790-152, servicio activo, 10 sesiones, memoria del servicio 296 MB, 471 pedidos y 15 rutas. Licencia e integridad correctas. Doce consultas a `/api/health` desde el VPS duraron entre 1.17 y 1.80 ms. Este control de salud no sustituye una prueba de navegacion autenticada.

## Puerta de despliegue

Desplegar solo en ventana autorizada, con backup y snapshot de pedidos/remitos. Verificar version 8790-153, `/api/health`, login de administrador y `deposito1`, Armado, seleccion de parada no consecutiva en ruta de prueba, validacion de remito de prueba sin afectar proveedores reales, y recorridos GPS. No registrar ventas ni remitos ficticios en produccion. Comparar conteos de pedidos, lineas, stock y rutas antes y despues. Tener rollback listo.
