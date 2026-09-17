# Incidente de rendimiento y contingencia - 2026-09-16

Estado: correccion `8790-148` preparada para prueba y despliegue controlado.

## Causa raiz confirmada

El servidor no estaba limitado por RAM ni por ancho de banda en la muestra estable. El cuello principal era un ciclo de realimentacion del estado monolitico:

1. Un usuario modificaba un dato y generaba una version nueva del estado.
2. Cada navegador descargaba el estado completo.
3. Administracion detectaba ubicaciones GPS no persistidas como datos faltantes.
4. El navegador volvia a subir automaticamente todo el estado.
5. Esa escritura generaba otra version y despertaba otra ronda para todos los usuarios.

Con varios usuarios conectados, cada ronda serializaba, comprimia, transmitia y volvia a escribir decenas de MB. El limite de sincronizaciones simultaneas evitaba la caida total, pero acumulaba rechazos controlados y esperas.

El estado productivo medido tenia aproximadamente 29 MB. Las colecciones activas mas pesadas eran auditoria global, pedidos archivados, pedidos activos, eventos, movimientos de stock, auditoria de pedidos y notificaciones. Antes de esta correccion `/api/health` ya mostraba 414 sincronizaciones completas rechazadas desde el arranque.

## Correcciones de `8790-148`

- Eliminacion de la subida automatica posterior a cada descarga. GPS y presencia quedan en sus endpoints dedicados.
- Respuestas completas de Administracion, Deposito y Recepcion serializadas y comprimidas una vez por version, con reutilizacion entre sesiones.
- Proyeccion por rol para Preventa y Reparto: no se transmiten auditorias, movimientos ni bases administrativas que esos roles no utilizan.
- Persistencia atomica del estado mediante archivo temporal y renombre.
- Validacion de remitos con respuesta compacta, timeout operativo de 120 segundos e idempotencia por remito, factura e importe.
- Rotacion automatica de logs al superar 128 MB, conservando el archivo historico.
- Ventanas activas reducidas para auditoria, eventos, outbox, notificaciones y rechazos GPS. El historial de auditoria continua en logs rotados y backups.
- Metricas en memoria para endpoints lentos, errores, maximos, promedio y demora del event loop, visibles en el monitor de superadministracion.
- Alta de pedidos sin migraciones globales repetidas: se normaliza al iniciar o mantener el sistema y cada venta actualiza solo el pedido, stock, comision y cliente afectados.
- Armado, etiquetas y listo para despacho actualizan lotes sin volver a recorrer todo el historial por cada pedido.
- Planificacion, toma de ruta, estado de parada y cobranza usan mutaciones puntuales y respuesta compacta; la sincronizacion general ocurre en segundo plano.

## Medicion antes y despues

Prueba aislada con estado sintetico de 44 MB, 10 vendedores, 4 administradores y 1 repartidor:

| Operacion | Antes | Despues |
| --- | ---: | ---: |
| Alta de pedido, promedio servidor | 3,75 s | 0,35 s |
| Alta de pedido, maximo en prueba de 30 | 6,70 s | 0,78 s |
| Armado/etiqueta/listo, promedio | 2,01 s | 0,50 s |
| Tomar ruta | 1,27-3,01 s | 0,33 s |
| Cambiar estado de reparto | 2,85 s | 0,69 s |
| Entrega y cobranza | 4,42 s | 0,32 s |
| Bloqueo maximo del event loop | 5,50 s | 0,70 s |

La prueba integral proceso 100 pedidos: 100 creados, 100 etiquetados, 100 listos y 100 planificados, sin errores ni timeouts. El recorrido completo termino en 73 segundos sobre el estado sintetico, incluyendo actividad simultanea y una entrega/cobranza.

## Contingencia sin detener ventas

1. No reiniciar por CPU, memoria o un timeout aislado. El monitor permanece en modo alerta.
2. Confirmar `/api/health/live`, PID, cola TCP, memoria, event loop y endpoint lento.
3. Si una operacion demora, no repetirla a ciegas. Consultar primero el estado del remito o pedido.
4. Mantener identificadores idempotentes en altas de pedidos y operaciones sensibles.
5. Si la API no esta disponible, registrar ventas en el circuito paralelo con identificador externo unico y conciliarlas antes de reingresar.
6. Rotar logs automaticamente y conservar archivos historicos; no truncar auditoria sin backup.
7. Antes de cada despliegue: backup de `data`, snapshot de pedidos, pruebas aisladas, despliegue, comparacion antes/despues y validacion de Admin, Preventa, Armado y Reparto.
8. Si sube la latencia, consultar `/api/admin/performance` para identificar el endpoint y no atribuir automaticamente el problema a CPU o RAM.
9. Si se alcanza el limite de sincronizaciones completas, los clientes deben reintentar con espera; nunca subir el estado completo como respuesta a una descarga.

## Trabajo estructural siguiente

El archivo JSON unico sigue siendo el limite arquitectonico. La solucion definitiva es separar escrituras y consultas por dominio en una base transaccional, exponer endpoints paginados y reemplazar la sincronizacion completa por eventos o deltas. `8790-148` elimina el ciclo que multiplicaba la carga y reduce el costo de la arquitectura actual, pero no convierte el archivo monolitico en una base escalable.
