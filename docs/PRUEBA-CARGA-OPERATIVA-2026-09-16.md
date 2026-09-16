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

