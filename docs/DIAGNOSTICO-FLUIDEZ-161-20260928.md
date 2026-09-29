# Fluidez y concurrencia - 28/09/2026

## Dictamen

Produccion 8790-161 sana durante la inspeccion de bajo impacto. No se reinicio ni modifico produccion en esta investigacion.
Integridad del circuito sintetico: aprobada. Fluidez bajo saturacion: NO aprobada.
No se garantiza ausencia de incidentes para la jornada siguiente.

## Produccion: observaciones

- Carga promedio 0.02/0.09/0.08; CPU libre 96-100% en muestras posteriores de vmstat.
- Memoria disponible aproximada 2630 MB; sin intercambio activo en esas muestras.
- Una sesion activa; sin rechazos de sincronizacion desde el arranque al inspeccionar.
- Salud local 1.4-2.1 ms; URL publica 41-90 ms, ambas medidas desde el servidor. No representan latencia desde celulares ni tiempos de los modulos.
- Estado persistido: 38335907 bytes.
- Sin warnings/errores recientes en journal consultado.

Esto descarta saturacion sostenida en el instante observado, no picos anteriores ni lentitud del navegador.

## Prueba aislada

Codigo del checkout 161. El guion conserva la etiqueta historica 8790-158-simulation; no identifica la version del codigo probado.
Windows local, 4 CPU logicas; no equivale al VPS de 2 vCPU.
10 vendedores, 4 administradores, deposito y repartidor; 100 pedidos de cinco lineas, 254 historicos, 300 clientes, 711 productos.
120 segundos de ingreso y aproximadamente 174 segundos hasta completar la segunda corrida.
Estado sintetico inicial 44.3 MB, final 57.1 MB, incluyendo relleno para exigir serializacion.
Lecturas forzadas version=0 cada cinco segundos: mas exigente que el cliente habitual, sin validar su estrategia de reintento ni tiempos de render.

Primera corrida: limite predeterminado 2, distinto de produccion; 218 rechazos. No usar como medida directa de produccion.
Segunda corrida: limite 4, igual a produccion; 116 rechazos STATE_SYNC_BUSY de 290 lecturas completas. Se mantienen como fallos en el informe, no se ocultan.

| Operacion, corrida con limite 4 | p95 ms | Maximo ms | Errores |
| --- | ---: | ---: | ---: |
| Crear pedido | 1944 | 2426 | 0 |
| Clientes | 1559 | 1887 | 0 |
| Armado batch | 798 | 1176 | 0 |
| Etiquetas batch | 1048 | 1066 | 0 |
| Listo despacho batch | 947 | 1214 | 0 |
| Consulta reparto | 1915 | 2223 | 0 |
| Cobrar y entregar | 1945 | 2489 | 0 |
| Lectura administracion | 13255 | 13917 | 15 |

Percentiles de lecturas incluyen rechazos; no son percentiles exclusivos de respuestas exitosas.
100 creados/preparados/etiquetados/planificados/entregados. 500 lineas, 100 bultos, 100 paradas unicas. Stock sin diferencias. Vendido=cobrado=874650. Historicos operativos conservados. Sin timeouts ni escrituras productivas.
290 escrituras completas: media 418 ms, p95 ultimas 64 muestras 631 ms; serializacion p95 245 ms y disco p95 397 ms. El estado completo sigue siendo un cuello de botella bajo carga.

## Mejora implementada localmente

El tablero renderizaba paneles ocultos y construia cuatro veces el resumen operativo por actualizacion. Ahora:
- Inicio: solo indicadores, una construccion del resumen.
- Estado de pedidos: un resumen compartido entre sus dos paneles.
- Resto: solo herramienta seleccionada.
- Al abrir una herramienta se calcula inmediatamente, sin cache persistente de datos contables.

Prueba automatizada de las siete vistas, sintaxis, herramientas y comisiones: OK. Navegador demo: inicio, estado de pedidos y comisiones muestran datos al abrirse.
Reduccion de llamadas redundantes verificada; mejora temporal de render aun no cuantificada con datos productivos.
Estado de esta mejora: implementada localmente, pendiente de despliegue.

## Proximos controles y contingencia

### Caso confirmado en codigo: apertura de Proveedores

El usuario indico demora al abrir Proveedores. renderSuppliers reconstruia las entidades cliente/proveedor una vez para el resumen y una vez por cada proveedor listado. Cada reconstruccion recorria todos los pedidos por cada entidad, aunque no fuera mixta.

Correccion local: ventas agrupadas una vez por nombre normalizado; cruce cliente/proveedor una vez por render; indice por clave reutilizado en las filas. Sin cache persistente y sin mutaciones de datos.

Benchmark reproducible scripts/benchmark-supplier-render.js compara codigo publicado 7b3ecdc contra el cambio local con 1314 clientes, 709 pedidos y 20 proveedores sinteticos:
- Calculo anterior: 34448.16 ms, 21 reconstrucciones.
- Calculo nuevo: 10.14 ms, 1 reconstruccion.
- Resultados identicos; casos de nombres normalizados, CUIT, valores negativos y datos vacios verificados.

Estos tiempos corresponden al calculo de relaciones, NO al tiempo total de apertura en un navegador ni a una medicion en produccion. Vista local de Proveedores y pruebas de cuentas consolidadas aprobadas. Despliegue de estas dos optimizaciones solicitado al usuario; aun pendiente.

1. Identificar modulo, dispositivo y URL del usuario afectado; comparar API y render en esa misma operacion.
2. Reducir respuestas completas por modulo/rol y separar escrituras grandes, con pruebas de compatibilidad antes de publicar. No subir concurrencia sin medir memoria y event loop.
3. Repetir prueba con versiones y reintentos reales, comprobar convergencia de todos los clientes y separar respuestas ocupadas de errores definitivos.
4. Ante demora al guardar: comprobar si el pedido/cobro existe antes de repetir. No reenviar cobros a ciegas.
5. Mantener una sola pestana operativa por usuario/dispositivo y cerrar demos que no se usan. No borrar almacenamiento de vendedores con pedidos sin sincronizar.
6. Si varios usuarios se demoran simultaneamente, registrar hora/operacion y consultar salud/cola/logs. No reiniciar por porcentaje de CPU ni ejecutar restauraciones como primera respuesta.

Evidencias: PERFORMANCE-161-BASELINE.json y PERFORMANCE-161-CONCURRENCY4.json. Los procesos de prueba finalizaron y el guion limpio sus datos temporales.
