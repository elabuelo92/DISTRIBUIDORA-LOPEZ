# Impresion de pedidos con faltantes - v90

Fecha: 2026-08-13

Version: `8790-90`

## Problema

En la solapa Pedidos el sistema no permitia imprimir factura/guia cuando un pedido estaba en estado `Pendiente` por faltantes de productos.

Ese bloqueo impedia al deposito usar el papel como guia operativa, aun cuando el pedido debia quedar claramente identificado como pendiente de abastecimiento.

## Cambio aplicado

- El boton `Factura` queda disponible para pedidos activos aunque tengan faltantes.
- La impresion masiva ya no omite pedidos con faltantes.
- La factura/guia muestra una advertencia visible:
  - pedido impreso con faltantes;
  - no autoriza despacho hasta completar reserva/abastecimiento.
- Cada producto con faltante se imprime resaltado en rojo.
- Se muestra:
  - cantidad solicitada;
  - cantidad reservada;
  - cantidad faltante.

## Regla que no cambia

El sistema sigue bloqueando el avance operativo a despacho si el pedido no tiene reserva completa, etiqueta generada, etiqueta escaneada y bultos confirmados.

Es decir: imprimir no significa despachar.

## Regeneracion de pedidos pendientes

Se agrego el script:

```bash
node scripts/regenerate-pending-orders.js
```

Funcion:

- recalcula el estado operativo;
- intenta asignar stock disponible a pedidos pendientes por faltantes;
- si un pedido queda completo lo pasa a `En Preparacion`;
- genera backup automatico antes de escribir.

Para prueba sin escribir:

```bash
node scripts/regenerate-pending-orders.js --dry-run
```

## Validaciones

- `node --check app.js`
- `node --check server.js`
- `node --check order-engine.js`
- `node --check scripts/regenerate-pending-orders.js`

## Estado

Implementado para despliegue productivo controlado.
