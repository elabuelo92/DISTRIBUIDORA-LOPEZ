# Release 8790-203: valuacion de inventario

## Alcance

Agrega en Estadisticas una herramienta administrativa para consultar el valor del stock por producto y rubro. No modifica cantidades, reservas, movimientos ni costos.

## Calculo y lectura

- Valor por producto: stock fisico actual multiplicado por costo unitario registrado.
- Stock disponible: fisico menos reservas, mostrado por separado y sin modificarlo.
- Productos sin costo positivo: se identifican como pendientes y se excluyen del total valorizado.
- Incluye busqueda por codigo/nombre, filtro por rubro y exportacion a Excel/PDF.

## Validacion

`node scripts/smoke-inventory-valuation.js` comprueba calculos, totales por rubro, costos faltantes, inmutabilidad de entrada y cableado de interfaz.

## Riesgo operativo

Consulta solamente el estado cargado en la aplicacion. El resultado no sustituye la conciliacion del conteo fisico ni debe usarse como confirmacion de que el lote de inventario fue aplicado.
