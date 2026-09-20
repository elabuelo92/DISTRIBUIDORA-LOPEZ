# Rendimiento operativo - 20/09/2026

## Alcance y seguridad

Mediciones productivas de solo lectura. La carga de 100 pedidos y entregas se
ejecuto en una instancia local con datos sinteticos, sin escribir en produccion.
Los tiempos locales no garantizan los de Vultr ni los de una red movil.

## Servidor productivo en reposo

- Version inicial: 8790-150. Servicio activo, cero reinicios desde el despliegue.
- Estado principal: 25.886.061 bytes. Memoria del servicio: aproximadamente 69 MB.
- Cinco consultas locales a `/api/health`: 1-27 ms.
- Tres consultas publicas a `index.html` desde el servidor: 81-87 ms.
- Secciones mas voluminosas del estado: pedidos 5,2 MB, pedidos archivados
  3,9 MB, movimientos de stock 3,2 MB, auditoria de pedidos 2,7 MB y auditoria
  global 2,3 MB. No se elimino ni altero ningun dato.

## Simulacion aislada

`benchmark-100-orders-v127.js`: con 100 pedidos y un estado pequeno, abrir
Clientes tardo 15 ms, consultar Reparto 95 ms, planificar 56 ms, reordenar
41 ms y publicar 138 ms. Son tiempos de API local, no de renderizado.

`simulate-operational-day.js`: 100 pedidos, 100 etiquetas y 100 entregas,
10 vendedores, 4 administradores y 1 repartidor, estado sintetico inicial de
44 MB y final de 56 MB. Sin errores HTTP ni timeouts. Percentil 95:

| Operacion | p95 local |
| --- | ---: |
| Login | 329 ms |
| Crear pedido | 1.483 ms |
| Sincronizar vendedor | 2.838 ms |
| Abrir Clientes | 1.497 ms |
| Consultar Reparto | 1.807 ms |
| Armado | 1.187 ms |
| Etiquetas | 1.401 ms |
| Planificar ruta | 1.293 ms |
| Cobrar entrega | 1.310 ms |

El guardado completo del JSON tardo 317 ms en promedio, 715 ms en el peor
caso. La serializacion y la escritura sincronas bloquean el hilo de Node;
esto explica parte de la demora de otras consultas bajo concurrencia.

## Cambio acotado para v151

En Preventa, una respuesta de sincronizacion sin cambios ya no vuelve a
construir la pantalla completa. Se actualizan solo GPS, objetivo de jornada y
guia contextual. Cuando cambia la version del estado, el render completo se
mantiene. Reparto ya tenia la misma proteccion. Esto reduce trabajo del
navegador y evita interrumpir seleccion y escritura; no reduce el costo de
persistir el JSON. Verificado con prueba de regresion y prueba visual movil.

## Riesgo y seguimiento

No se puede prometer ausencia de demoras esta semana a partir de una prueba
local. Durante la jornada real hay que medir `/api/admin/performance` con un
administrador autorizado y registrar p95, errores, escrituras de estado,
retardo del event loop y usuarios simultaneos. Si aparecen errores o una
degradacion sostenida, detener las pruebas de carga y conservar la venta por
el procedimiento de contingencia existente. La solucion estructural requiere
separar pedidos, rutas, cobranzas y auditoria en almacenamiento transaccional,
con migracion, respaldo y ensayo de restauracion; no corresponde improvisarla
antes de la jornada de ventas.
