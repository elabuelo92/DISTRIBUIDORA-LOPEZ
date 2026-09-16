# Prueba de carga operativa - 16/09/2026

Estado: simulacion aislada completada en el mismo VPS. No se crearon pedidos, etiquetas, rutas, cobranzas ni usuarios en los datos productivos.

## Escenario

- Duracion objetivo: 10 minutos.
- Actores sinteticos: 10 vendedores, 4 administradores y 1 repartidor.
- Volumen: 100 pedidos con cinco productos por pedido.
- Flujo: login, consulta de estado, consulta de clientes, alta de pedido, armado, generacion de etiquetas, listo para despacho, planificacion, reordenamiento, publicacion, toma de ruta y una entrega/cobranza.
- Estado sintetico: 44.269.296 bytes, similar al archivo productivo de la medicion.
- Transporte final: conexion nueva por solicitud. La variante con conexiones persistentes tambien se midio.

## Resultado funcional

- Pedidos creados: 100/100.
- Pedidos con etiqueta: 100/100.
- Pedidos listos para despacho: 100/100.
- Pedidos planificados: 100/100 en dos rutas.
- Entrega/cobranza representativa: 1/1.
- Errores HTTP o timeouts en la corrida final: 0.
- Reintentos o conciliaciones en la corrida final: 0.
- Escrituras sobre produccion: 0.

## Latencias de la corrida final

| Operacion | p50 | p95 | Maximo |
| --- | ---: | ---: | ---: |
| Crear pedido | 4,0 s | 6,6 s | 9,4 s |
| Leer estado vendedor | 6,7 s | 20,8 s | 21,3 s |
| Consultar clientes admin | 0,03 s | 4,5 s | 5,1 s |
| Consultar reparto | 0,24 s | 5,0 s | 5,9 s |
| Pasar a armado | 3,3 s | 6,3 s | 8,4 s |
| Generar etiquetas | 2,7 s | 5,7 s | 6,6 s |
| Listo para despacho | 3,9 s | 7,4 s | 8,7 s |
| Planificar ruta | 1,7 s | 3,6 s | 3,6 s |
| Publicar ruta | 1,6 s | 1,9 s | 1,9 s |
| Cobrar/entregar | 5,4 s | 5,4 s | 5,4 s |

## Recursos y salud publica durante la prueba

- Carga maxima observada del VPS: 1,78 sobre 2 vCPU.
- Memoria disponible minima observada: aproximadamente 2,0 GiB.
- RSS maximo aproximado del proceso aislado: 713 MiB.
- Swap del proceso productivo ya estaba en uso; la simulacion no provoco OOM.
- Controles publicos durante la corrida final: 41.
- Fallas o controles lentos: 0.
- Latencia publica maxima observada durante la corrida: 122 ms.

## Hallazgo de transporte

En dos prepruebas con conexion HTTP persistente aparecieron `ECONNRESET` al crear pedidos. La consulta posterior por `operationId` y un unico reintento seguro recuperaron 10/10 pedidos sin duplicados. La corrida con conexion nueva no reprodujo el corte. Esto valida la proteccion idempotente, pero no autoriza a ignorar futuros cortes de transporte.

## Hallazgo bloqueante posterior

Horas despues de finalizada la simulacion aislada, durante actividad productiva real, el ERP dejo de responder incluso en `/api/health/live` sin reiniciarse. Diagnostico en vivo:

- mismo PID y `NRestarts=0`;
- mas de 400 conexiones internas con datos en cola;
- 146 conexiones establecidas y 355 en `CLOSE-WAIT` en una muestra;
- archivo productivo de aproximadamente 44,6 MB;
- Node con cerca de 900 MiB RSS y swap activa;
- repeticion por solicitud de validacion de directorios y lectura de usuarios/configuracion;
- serializacion/compresion repetida del estado grande en el hilo principal;
- sincronizacion configurada cada 2,5 s para administracion y cada 7 s para usuarios moviles.

La prueba demuestra que el flujo funcional completa 100 pedidos, pero tambien que el modelo de sincronizacion de estado completo no ofrece margen suficiente frente a varias sesiones/pestanas y actividad sostenida. No corresponde afirmar que el sistema esta libre de riesgo para la jornada siguiente.

## Correccion recomendada

1. Recuperar el servicio con una unica intervencion controlada autorizada; no habilitar bucles de reinicio.
2. Evitar enviar el estado completo ante cada cambio: respuestas por rol, paginacion y parches/deltas.
3. Cachear la serializacion/compresion por version y rol; separar presencia del estado pesado.
4. Evitar `mkdir`, lectura de usuarios y configuracion en cada request mediante inicializacion y cache con invalidacion.
5. Limitar solicitudes de sincronizacion simultaneas y aplicar backpressure explicito.
6. Aumentar temporalmente los intervalos de polling hasta desplegar la sincronizacion incremental.
7. Agregar metricas de event loop, solicitudes en vuelo, cola y tamano/tiempo de serializacion.
8. Repetir el escenario de 100 pedidos tras la correccion y exigir p95 menor a 2 s para operaciones normales, sin cola acumulada al finalizar.

## Protecciones preparadas localmente

Estado: implementadas y verificadas localmente; pendientes de despliegue productivo controlado.

- sincronizacion administrativa cada 10 segundos y movil cada 15 segundos;
- timeout exclusivo de sincronizacion de estado de 45 segundos, sin relajar los timeouts de operaciones de negocio;
- maximo de dos respuestas completas de estado simultaneas;
- respuesta `STATE_SYNC_BUSY` con reintento automatico cuando el servidor esta ocupado;
- ruta de estado sin cambios y `/api/health/live` fuera de la cola pesada;
- ventana activa de 1.000 auditorias, 1.000 eventos y 1.000 elementos de outbox, conservando el historial append-only;
- cache con invalidacion por fecha de modificacion para usuarios y configuracion de sesiones;
- inicializacion de directorios una sola vez por proceso;
- GPS de vendedores limitado a una aceptacion cada 30 segundos y reparto cada 10 segundos;
- auditoria GPS normal limitada a una entrada cada cinco minutos, sin perder alertas;
- rotacion preservando archivo historico para `session-audit.log`, `gps-history.log` y `global-audit.log` desde 128 MB;
- keep-alive HTTP de 10 segundos y headers timeout de 15 segundos.

## Verificacion local de las protecciones

- 12 sincronizaciones completas concurrentes con limite 1: 1 atendida, 11 en espera controlada y salud viva disponible;
- rafaga de 25 ubicaciones GPS: 1 persistida y 24 limitadas sin cerrar sesion;
- rotacion de tres logs: archivos historicos preservados y logs activos recreados;
- flujo pedido, armado, etiqueta, listo para despacho: OK;
- reimpresion de etiqueta idempotente: OK;
- planificacion y reordenamiento de 60 pedidos: OK;
- despacho sin escaneo fisico obligatorio: OK;
- monitor configurado en modo alerta, sin reinicios automaticos: OK.

Se ejecuto ademas una pasada operativa posterior de 60 segundos, con 10 vendedores, 4 administradores, 1 repartidor y estado sintetico de 44.269.296 bytes:

- pedidos creados/listos/planificados: 10/10/10;
- etiquetas: 10/10;
- rutas: 2;
- entrega y cobranza representativa: 1;
- errores HTTP y timeouts: 0;
- lectura de estado vendedor p95: 4,2 s, frente a 20,8 s en la corrida previa;
- etiquetas p95: 1,0 s;
- listo para despacho p95: 1,0 s;
- planificacion p95: 1,3 s;
- publicacion de ruta p95: 0,7 s.

Esta pasada confirma ausencia de regresion funcional y una mejora clara en el entorno aislado. No reemplaza la validacion productiva posterior al despliegue.

## Activacion productiva pendiente

La activacion requiere backup, snapshot de pedidos, rotacion de logs, despliegue, un unico reinicio controlado y validacion posterior. No se debe activar un ciclo de reinicios automaticos. Hasta completar esa secuencia el estado correcto es: `Implementado localmente, pendiente de despliegue`.
