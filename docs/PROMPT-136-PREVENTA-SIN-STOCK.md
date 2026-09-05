# Prompt 136 - Preventa sin stock

## Regla operativa

- Un producto con stock disponible menor o igual a cero permanece visible y marcado como `SIN STOCK`.
- El preventista puede seleccionarlo, indicar cantidad y enviarlo dentro del pedido completo.
- La reserva utiliza solamente el stock disponible y conserva la diferencia en `missingQty`.
- El faltante continúa visible para Administración, Armado y abastecimiento.
- La venta no modifica artificialmente el stock físico ni genera existencias negativas.

## Protección

La API ya no rechaza pedidos por falta de stock. La regla no puede desactivarse desde Administración, evitando diferencias entre la aplicación móvil y el servidor.

## Pruebas

```powershell
npm.cmd run test:preventa-commissions
npm.cmd run test:order-workflow
```
