# Reparto: operacion de 100 entregas (v150)

## Cambios

- El repartidor usa una lista compacta sin scroll horizontal. La parada actual tiene los comandos de cobro e incidencia visibles; las demas muestran acceso breve a Maps.
- Busqueda por cliente, pedido o direccion; filtros de pendientes, incidencias y todas; carga visual en bloques de 15.
- El mapa embebido solo se crea cuando se abre expresamente. Una sincronizacion sin cambios no vuelve a construir la pantalla del conductor.
- Cobrar o registrar una incidencia desde un pedido despachado inicia la visita dentro de la misma operacion, con GPS y traza. La accion separada "Iniciar visita" sigue disponible.
- La respuesta confirmada actualiza pedido y ruta localmente. El conductor no descarga todo el estado otra vez despues de cada parada.
- El recalculo de metricas posterior a una entrega se limita al vendedor de ese pedido.
- Ante un timeout de cobranza, el resultado se informa como incierto y se ofrece consultar el estado, no reenviar automaticamente.

## Verificacion aislada

- 100 pedidos creados, 100 etiquetados, 100 planificados y 100 entregados; 0 errores HTTP y 0 timeouts. Base sintetica de 44 MB iniciales, 10 vendedores, 4 administradores, 1 repartidor; sin escrituras en produccion.
- Cobranza HTTP: mediana 388 ms; p95 1088 ms; maximo 1539 ms. Creacion de pedido: mediana 480 ms; p95 881 ms.
- 100 entregas directas sin una peticion adicional para "Iniciar visita".
- Pruebas de 60 pedidos, cobro directo, incidencia directa y rechazo de doble cobro; vista verificada a 360, 390 y 1280 px sin desborde horizontal.

Estas cifras pertenecen a una simulacion local. No son una garantia de tiempo en el servidor ni en redes moviles reales.

## Riesgo que permanece

El estado aun se serializa y escribe como un archivo JSON completo en cada operacion. En la simulacion llego a 56 MB; cada escritura tomo 301 ms en promedio. Es el principal limite de escalabilidad restante y no se resuelve borrando cache ni reiniciando el servicio. Las siguientes etapas deben separar pedidos, rutas, cobranzas y auditoria en almacenamiento transaccional, con consultas paginadas e identificadores idempotentes de cobranza. Antes de una migracion: respaldo, comparacion de totales e historial y ensayo de restauracion.
