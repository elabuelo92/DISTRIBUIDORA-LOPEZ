# P6 - Cancelacion definitiva de No entregado

Estado: implementado localmente; pendiente de revision visual y despliegue.
Base: produccion P5, commit 86d3e2c. No incluye P7-P11.

## Circuito

- Administracion: Pedidos > No entregado > Cancelar y recibir devolucion.
- Motivo obligatorio y confirmacion explicita de recepcion fisica completa,
  apta para venta, sin ajuste previo. No utilizar para pedidos de prueba.
- Conserva pedido, numero, cliente, vendedor, lineas, precios e historial.
- Cambia a Cancelado y registra recepcion, motivo, actor y fecha.
- Reintegra solo las cantidades que coinciden con la salida Despacho.
- Recibo deterministico por pedido: repetir o enviar simultaneamente no duplica.
- Mantiene reservas de otros pedidos y los cierres/paradas historicos intactos.
- Segunda Visita sigue siendo un circuito distinto, sin cancelacion definitiva.

## Protecciones

Solo administrador. Bloquea cobros, cuenta imputada, entregas o devoluciones
parciales, comisiones liquidadas/pagadas, paradas activas, diferencias contra
la salida registrada, movimientos adicionales, datos desactualizados y falta
de confirmaciones. La persistencia reutiliza el endpoint atomico receive-return.
No cambia saldos ni borra cierres ni crea pedidos nuevos.

## PED-3776 (consulta de produccion, solo lectura)

El cliente registrado es Dario Godoy (el listado inicial decia Diego).
Estado No entregado; importe 69.065,58; stockSettled true; accountPosted false.
Una parada historica en ruta completada/cerrada informa Pedido rechazado,
observacion No lo quiso. No se modifico el pedido ni se reintegro stock real.
Antes de operar: revisar todas sus asignaciones y confirmar recepcion fisica
y ausencia de compensaciones previas. La consulta no acredita recepcion fisica.

## Pruebas

scripts/smoke-rejected-stock-return.js --p6:
- Motor y HTTP aislados: cancelacion, stock una sola vez, persistencia/reintento.
- Dos solicitudes simultaneas: un recibo, un movimiento; repartidor recibe 403.
- Reservas ajenas, lineas, importes, cuentas, clientes y rutas sin cambios.
- Bloqueos por cobros, comisiones, parada activa, version y confirmaciones.
- Regresion sin --p6: motor y HTTP del circuito original de Rechazados pasaron.
- Sintaxis de app.js/server.js y git diff --check: sin errores.

El arranque inicial supero el plazo de 10 segundos. Con 30 segundos de margen,
la prueba completa paso; no se ejercio carga contra produccion.

## Checklist previo a publicar

- [ ] Revision visual del boton, confirmacion y aviso de recepcion en demo.
- [ ] Respaldo de produccion y autorizacion/ventana de reinicio.
- [ ] Version/cache, integridad y salud tras despliegue.
- [ ] Comparacion de archivos de datos antes/despues del despliegue.
- [ ] Confirmacion operativa independiente para cualquier devolucion real.
