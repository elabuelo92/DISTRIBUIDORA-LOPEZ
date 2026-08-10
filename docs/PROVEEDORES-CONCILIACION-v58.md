# Distribuidora Lopez - v58 Proveedores, Remitos y Pagos

Fecha: 2026-07-21
Puerto operativo: 8790

## Prompt 50 - Conciliacion administrativa de remitos

Regla principal:

- cargar un remito NO actualiza stock.
- cargar un remito NO actualiza cuenta corriente del proveedor.
- el remito queda en estado Pendiente de Validacion.

Administracion debe conciliar el remito validando:

- remito recibido.
- factura asociada.
- importe final.
- costos.
- diferencias.
- observaciones administrativas.

Solo al presionar Validar e ingresar stock:

- se ingresa la mercaderia al stock.
- se actualizan pedidos pendientes de abastecimiento si corresponde.
- se registra la deuda en cuenta corriente del proveedor.
- se genera auditoria y notificacion.

## Prompt 51 - Gestion integral de proveedores

Se agrego registro de pagos a proveedores mediante:

- efectivo.
- transferencia.
- mercaderia.

Cada pago requiere documentacion de respaldo:

- foto.
- imagen.
- PDF.

El pago queda inicialmente en estado:

- Pendiente conciliacion.

La deuda del proveedor se descuenta solamente cuando Administracion presiona:

- Conciliar pago.

Al conciliar:

- se actualiza total pagado.
- se reduce saldo pendiente del proveedor.
- se registra movimiento en cuenta corriente.
- se guarda auditoria completa.

## Cuenta corriente proveedor

En Proveedores se agrego un panel de cuenta corriente por proveedor.

Muestra:

- saldo actual.
- total comprado.
- total pagado.
- movimientos conciliados.
- debe.
- haber.
- saldo.

## Estados importantes

Remitos:

- Pendiente de Validacion.
- Validado por administracion.
- Stock ingresado.

Pagos:

- Pendiente conciliacion.
- Pago conciliado.

## Validacion realizada

Prueba temporal en puerto 8791 con copia de datos:

- stock antes del remito: 22.
- stock luego de cargar remito pendiente: 22.
- stock luego de validar remito: 24.
- pago proveedor creado: Pendiente conciliacion.
- pago proveedor conciliado: Pago conciliado.

Resultado:

La regla queda cumplida: la mercaderia no impacta stock hasta la validacion administrativa.
