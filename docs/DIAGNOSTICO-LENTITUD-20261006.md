# Diagnostico de lentitud - 2026-10-06

Estado: diagnostico de solo lectura. Sin despliegue, reinicios ni cambios de datos.

## Evidencia

- Produccion 8790-166, commit 0e5dfe3; PID 1667450 al consultar.
- Usuario reporta lentitud general despues de las 15:00 ART.
- Historico sysstat del 6 de octubre entre 18:00 y 23:50 UTC: CPU libre aproximadamente 88-97%, memoria disponible superior a 2 GB, iowait practicamente nulo. Promedios de unos 10 minutos no descartan bloqueos breves.
- Consulta autenticada GET /api/admin/performance: generatedAt 2026-10-07T01:20:00.558Z (6 de octubre, 22:20 ART).
- Contadores acumulados del proceso; NO son una medicion exclusiva de la franja posterior a las 15:00 ni permiten fechar los maximos.

| Operacion | Muestras | Promedio ms | Maximo ms |
| --- | ---: | ---: | ---: |
| GET /api/state | 7288 | 214 | 27633 |
| Aprobacion comercial | 7 | 8644 | 13811 |
| Validar remito | 3 | 6185 | 11571 |
| Editar pedido | 56 | 3783 | 7603 |
| Etiqueta | 75 | 1034 | 7757 |
| Cobrar pedido | 32 | 1434 | 4417 |

- Event loop: p95 20 ms, maximo 29712 ms. Pausas severas verificadas, no saturacion continua.
- Escrituras: 1410; promedio 925 ms, maximo 1619.7 ms; p95 de las ultimas 64: 1171 ms.
- Ultima escritura: 975.2 ms, serializacion 646.5 ms, disco 328.4 ms; 54116540 bytes.
- Migracion en lectura: 10 muestras, maximo y p95 5383 ms.
- Cola de sincronizacion al consultar: 0; rechazadas desde arranque: 0. No descarta esperas anteriores.

## Revision del codigo

- writeState serializa todo el estado y usa writeFileSync/renameSync.
- Edicion y aprobacion comercial llaman accountEngine.migrateState, que recorre todos los clientes y recalcula accountSummary para cada uno.
- La aprobacion comercial clona el estado completo antes de operar.
- El flujo GET /api/state puede ejecutar migraciones y serializacion de proyecciones/secciones.

Esto identifica costos compartidos y pausas reales. NO prueba aun que una modificacion concreta cause el incidente, ni explica por si solo el maximo de 29.7 segundos.

## Siguiente verificacion aislada

1. Perfilar recalculo de cuentas, clonacion, proyeccion y serializacion con datos representativos fuera de produccion.
2. Comparar resultados completos de saldos, stock, pedidos y auditoria antes/despues de cualquier optimizacion.
3. Medir concurrencia de administracion, preventa y reparto sin inyectar operaciones de prueba en produccion.
4. No quitar controles, historiales ni confirmacion de persistencia para aparentar velocidad.
5. Despliegue solo con pruebas, respaldo y autorizacion; no mezclar las correcciones pendientes de dispositivos de reparto con este diagnostico.
