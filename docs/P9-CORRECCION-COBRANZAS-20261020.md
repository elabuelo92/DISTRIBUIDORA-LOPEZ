# P9 - Correcciones de cobranzas cerradas

Estado: implementado localmente, pendiente de despliegue. Produccion no fue accedida ni modificada durante este trabajo.

## Circuito

Administracion > Reparto > Corregir cobranzas cerradas:

1. Consultar cierres y seleccionar ruta y cobro original.
2. Indicar efectivo/transferencia correctos, motivo y comprobante de la nueva transferencia.
3. Previsualizar reverso, saldo actual/posterior, pendiente bancario y ajustes de caja.
4. Confirmar. La operacion crea un reverso y un reemplazo vinculados al cobro y al cierre original.

El saldo del cliente cambia; los pedidos, visitas originales, rutas, cierres, stock y liquidaciones permanecen intactos. Los ajustes se consultan en una tabla separada del manifiesto historico. La nueva transferencia no descuenta deuda hasta validarse por el circuito bancario existente. No equivale a mover dinero bancario.

## Protecciones

- Solo Administracion puede consultar o aplicar.
- Motivo obligatorio, importes finitos no negativos con dos decimales y cliente unico.
- Vista previa versionada con hash de cliente, ruta, cobro, banco e importes. Cambios posteriores requieren nueva vista previa.
- Identificador de operacion y firma: doble clic/reintento concurrente aplica una sola vez; reutilizar el identificador con otro contenido falla.
- Escritura atomica del estado y auditoria con usuario, fecha, original, reverso, reemplazo e impacto.
- El servidor no acepta URLs de comprobantes enviadas por el navegador.
- Tablero y resumen de ingresos descuentan los reversos; no los tratan como gastos ni suman el reemplazo dos veces.

## Limites explicitos de esta primera entrega

- Transferencias originales pendientes/observadas: bloqueadas; no se anulan automaticamente.
- Pagos triangulados a proveedores: bloqueados, requieren circuito especifico de conciliacion.
- Saldos a favor o historicos sin desglose/identidad bancaria suficiente: bloqueados para revision.
- Una correccion por cobro original. La correccion de una correccion queda fuera de esta entrega.
- El manifiesto y cierre historicos no se reescriben. Los ajustes administrativos se muestran separados; no se agrego una exportacion consolidada de ajustes.
- Las rutas deben conservarse con su cierre y el cobro original. No se reconstruyen datos ausentes.

## Pruebas

Motor: reverso + reemplazo, pago parcial, cambio de medio, transferencia validada, validacion de nueva transferencia una sola vez, reintentos, vista previa obsoleta, roles y bloqueos de casos ambiguos.

HTTP aislado: roles, vista previa sin escritura, confirmaciones concurrentes, auditoria persistida, comprobante y conciliacion; comparacion de cierres/rutas/pedidos/visitas/liquidaciones sin cambios.

UI: correccion ficticia desde formulario, confirmacion y registro persistido; historial movil legible. Foto: P9-demo-movil.png. VM: calculo neto de cobros y protecciones de formulario.

Regresion completa: node scripts/review-p1-p8.js --p9. Ver resultado en REVISION-P1-P9-20261020-results.json.

## Antes de produccion

- Revisar limites anteriores con Administracion.
- Preparar version/cache e integridad del paquete; respaldo y despliegue controlado.
- Verificar salud, mantenimiento desactivado y datos identicos al respaldo tras publicar.
- No ejecutar correcciones reales como parte de la prueba de despliegue.
