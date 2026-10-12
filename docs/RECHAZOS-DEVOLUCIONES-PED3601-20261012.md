# Rechazos y devoluciones: primer circuito

Estado: implementado y probado localmente; despliegue autorizado, pendiente de validacion en produccion. PED-3601 productivo sin modificaciones. Cache de publicacion: 8790-169-r20261012d.

## Diagnostico de produccion, solo lectura
- PED-3601, Cliente de prueba, producto 814 Jabon en Pan Signo, 5000 unidades a 632, total 3160000.
- Reserva y despacho del 09/10/2026. Salida fisica registrada: -5000, de 7104 a 2104.
- Estado Rechazado, ruta RUTA-20261009-RUTA-PRUEBA completada, sin cobranza y accountPosted=false.
- No aparece devolucion vinculada al pedido. No aparecen movimientos distintos de reserva/despacho del producto 814 desde 09/10 en stockMovements actualmente disponible.
- Existencias observadas: fisico 1873, reservado 97, disponible 1776. Son valores de consulta, no condiciones futuras de escritura.
- Usuario confirma que fue una prueba sin movimiento real. No usar recepcion fisica para corregir esta prueba. Falta confirmar que no hubo compensacion fuera del historial consultado antes de aplicar un ajuste auditado especifico.
- Causa de la advertencia: interfaz ofrecia Cancelar para Rechazado/No entregado/Postergado, aunque el motor prohibe cancelar un pedido ya despachado.

## Solucion local
- Retirar Cancelar de esos estados.
- Administracion puede Recibir devolucion completa para un rechazado despachado con inventario por reserva.
- Confirmacion explicita de recepcion fisica completa en condiciones de venta y ausencia de ajuste previo. Motivo y version del pedido obligatorios.
- Verificar productos, cantidades y movimientos de despacho exactos antes de tocar stock.
- No reintegrar automaticamente al marcar rechazo ni al planificar una segunda visita.
- Comprobante persistente por pedido y movimiento por producto. Reintento, doble clic o nueva solicitud tras reinicio no vuelve a incrementar stock.
- Conservar pedido, importe, lineas, ruta historica y estado Rechazado; no reabrir ventas ni modificar cuentas.
- Mantener reservas de otros pedidos. No asignar automaticamente a faltantes en este paso.
- Rechazar pedidos con cobranza, asiento contable, entregas/devoluciones parciales o movimientos adicionales: requieren conciliacion, fuera del alcance de esta primera fase.
- Cambios productivos solo tras aprobacion, respaldo y despliegue; correccion de prueba PED-3601 se trata por separado.

## Pruebas
- smoke-rejected-stock-return: reintegro ficticio 5000 una vez, 97 reservadas de otro pedido intactas, persistencia y repeticion tras migracion.
- HTTP aislado: dos POST simultaneos, un recibo y movimiento, repartidor sin permiso, mismo pedido.
- Motor: sin mutaciones ante producto inexistente, salida inconsistente, movimiento adicional, cobranza, entrega parcial o estado no entregado.
- smoke-second-visit-20260927: conserva original, visita historica y stock sin descuento adicional.
- Sintaxis app.js/server.js y git diff --check OK.

## Pendientes
- Validacion visual con usuario administrativo y confirmacion fisica de una devolucion real cuando corresponda.
- Despliegue controlado.
- Reparacion auditada de PED-3601 tras confirmar ausencia de compensacion previa.
- Luego: correccion de cobranzas cerradas; no implementada en esta fase.
