# Prompts 104, 105 y 106 - Preventa, jornada y comisiones

Version: `8790-111`

Fecha: 25/08/2026

## Prompt 104 - Productos sin stock

- Un producto con stock disponible igual o menor que cero permanece visible en Preventa.
- Se muestra con fondo y borde rojo, junto con el texto `SIN STOCK`.
- Se conservan nombre, codigo, presentacion y precio.
- El stock bajo se identifica por separado como `STOCK BAJO`.
- Por defecto no se puede seleccionar ni agregar un producto agotado.
- Administracion dispone de `Admin > Politica de Preventa` para habilitar excepcionalmente la preventa sin stock.
- El cambio de politica exige motivo, revalidacion de clave y genera auditoria.
- La API vuelve a validar la politica para impedir que un cliente modificado evite el bloqueo visual.

## Prompt 105 - Mi jornada

La pestaña anterior `Estado` se denomina ahora `Mi jornada` y muestra solamente datos del vendedor autenticado correspondientes al dia actual:

- objetivo diario;
- clientes vendidos;
- pedidos realizados;
- bruto vendido;
- comision estimada;
- visitados, sin compra y pendientes;
- efectividad y avance;
- ticket promedio;
- estado GPS.

Las ventas fuera de la cartera habitual tambien pertenecen al vendedor que efectivamente registro la operacion. Cuando existen autorizaciones comerciales, anulaciones o devoluciones, la pantalla informa expresamente que la comision es estimada.

## Prompt 106 - Motor centralizado de comisiones

La fuente unica de calculo es `order-engine.js` tanto en navegador como en servidor.

- Las reglas se configuran por rol, usuario, rubro o producto.
- La prioridad distingue regla de usuario/producto, usuario/rubro, rol/producto, rol/rubro y regla general.
- Cada linea conserva base neta, porcentaje, importe, identificador y snapshot completo de la regla aplicada.
- Los descuentos reducen la base comisionable.
- Las devoluciones descuentan la parte proporcional.
- Las anulaciones llevan la comision a cero.
- La venta se atribuye al vendedor autenticado que la registro, incluso cuando cubre otra cartera.
- Se elimino el calculo alternativo fijo del 3 por ciento en el frontend.

## Prueba automatizada

Ejecutar:

```powershell
npm.cmd run test:preventa-commissions
```

La prueba cubre venta general, cigarrillos, venta mixta, descuento, anulacion, devolucion, vendedor efectivo, snapshot historico y politica de stock agotado.
