# V77 - Armado, Orden de Armado y Reparto

Fecha: 2026-08-03

## Alcance

- Prompt 65: etiquetas de armado sin guiones visibles y con Numero de Orden de Armado junto a Bultos.
- Prompt 66: sincronizacion de Numero de Pedido, Orden de Armado, Bultos, Cliente, Ruta y Estado hacia Reparto.
- Prompt 67: eliminacion del buscador global. Se mantienen buscadores especificos por modulo.
- Prompt 68: nuevo Panel de Control de Armado dentro de Armado / Deposito.

## Cambios aplicados

- El motor de pedidos asigna `assembly.orderNumber` automaticamente cuando el pedido entra en preparacion, armado, etiquetado, listo para despacho o estados posteriores.
- Las etiquetas imprimen:
  - Pedido con numero legible.
  - Orden de Armado.
  - Bultos.
  - ID de bulto sin guiones visibles.
- El motor de reparto sincroniza los datos logisticos del pedido en cada parada sin alterar la secuencia ni el estado de ruta.
- La app de reparto muestra Pedido, Orden de Armado y Bultos en cada parada.
- Armado / Deposito incorpora una grilla operativa con semaforo por estado y ordenamiento por:
  - Orden de Armado.
  - Ruta.
  - Horario.
  - Cliente.
- Se elimino el buscador general del encabezado.

## Validaciones

- `node --check app.js`: OK.
- `node --check order-engine.js`: OK.
- `node --check delivery-engine.js`: OK.
- `node --check server.js`: OK.
- Prueba de motor: pedido en preparacion recibe Orden de Armado automaticamente.
- Prueba de motor: parada de reparto hereda Orden de Armado y Bultos desde el pedido.

## Observaciones

- El codigo tecnico de escaneo se conserva para no romper la pistola laser.
- Lo que se elimina son los guiones visibles en el formato impreso y en la vista previa.
- Se recomienda cerrar estabilidad de Version 1.0 antes de seguir incorporando automatizaciones avanzadas.
