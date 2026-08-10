# Ciclo de pedidos, reservas y abastecimiento

Fecha: 2026-06-23

Version frontend: `8790-19`

## Objetivo

Permitir preventa de mercaderia sin stock suficiente, sin inventar existencias fisicas y conservando trazabilidad desde el vendedor hasta la entrega.

## Estados logisticos

1. `Preventa`: evento inicial de registro y validacion.
2. `Pendiente de abastecimiento`: el pedido tiene uno o mas faltantes.
3. `Completo para armado`: todas las unidades estan fisicamente disponibles y reservadas.
4. `Armado`: deposito prepara la mercaderia.
5. `Despachado`: el pedido salio en reparto y se produjo la salida fisica de stock.
6. `Entregado`: el cliente confirmo la recepcion.
7. `Cancelado`: estado excepcional; libera reservas y revierte la venta antes del despacho.

`Preventa` queda registrada en la trazabilidad. La evaluacion del stock es inmediata, por lo que el estado operativo pasa automaticamente a `Pendiente de abastecimiento` o `Completo para armado`.

## Modelo de inventario

Cada producto mantiene:

- `stock_fisico`: unidades existentes en deposito.
- `stock_reservado`: unidades comprometidas a pedidos activos.
- `stock_disponible`: fisico menos reservado.
- `stock_en_transito`: mercaderia comprada pero no recibida.

Cada renglon de pedido mantiene cantidad solicitada, reservada, faltante, precio unitario y total.

## Reglas implementadas

- Crear un pedido no reduce el stock fisico.
- Se reserva inmediatamente todo lo disponible.
- El remanente genera un faltante visible en Stock > Abastecimiento.
- Los ingresos se asignan primero a pedidos urgentes y luego por antiguedad FIFO.
- Cuando desaparecen todos los faltantes, el pedido cambia automaticamente a `Completo para armado`.
- El stock fisico se descuenta al avanzar de `Armado` a `Despachado`.
- No se permiten entregas parciales en esta fase.
- Solo administracion puede avanzar, priorizar o cancelar pedidos.
- Una cancelacion previa al despacho libera reservas, reasigna unidades pendientes y revierte la venta.
- Un pedido despachado no se cancela: requiere un futuro proceso de devolucion.

## Mercaderia en transito

El formulario de ingreso de stock incorpora:

- `Mercaderia en transito`: informa compra sin aumentar el fisico.
- `Ingreso desde transito`: reduce transito, aumenta fisico y ejecuta la asignacion automatica.

## Compatibilidad historica

Los 23 pedidos existentes se migran como `legacy-deducted`, porque su stock ya habia sido descontado con la logica anterior. No generan reservas nuevas ni vuelven a descontarse al avanzar.

Equivalencias:

- `Recibido` -> `Completo para armado`.
- `En armado` -> `Armado`.
- `Listo reparto` / `En reparto` -> `Despachado`.
- `Facturado` -> `Entregado`.

## Seguridad de concurrencia

Las operaciones criticas utilizan endpoints de servidor:

- `POST /api/orders`
- `POST /api/orders/:code/advance`
- `POST /api/orders/:code/priority`
- `POST /api/orders/:code/cancel`
- `POST /api/stock/entry`

El guardado general tambien incorpora control de version para rechazar escrituras basadas en un estado antiguo.

## Cobranza

El pedido incorpora `collectionStatus` y `paymentMethod`, pero el circuito de cobranza se desarrollara como eje separado. `Entregado` y `Cobrado` no deben ser estados mutuamente excluyentes.

## Pruebas realizadas

- Pedido de 100 unidades con 18 fisicas: reserva 18 y faltante 82.
- Registro de 82 unidades en transito: no modifica el fisico.
- Recepcion de 82 unidades: pedido completo automaticamente.
- Armado y despacho: salida fisica de 100 unidades.
- Prioridad urgente antes de FIFO.
- Cancelacion y reasignacion de reservas.
- Login y ciclo HTTP real contra servidor temporal.
