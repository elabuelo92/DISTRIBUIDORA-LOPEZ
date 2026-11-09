# Release 8790-204: conciliacion de unidades vendidas y comisiones

## Alcance

- Presenta unidades pedidas, devueltas y netas en el resumen y detalle de ventas/comisiones.
- Excluye pedidos cancelados, rechazados o anulados y ordenes de cobro del detalle de ventas, igual que Estadisticas.
- Alinea las columnas de unidades de Estadisticas y sus exportaciones Excel con los mismos tres conceptos.
- Conserva los importes, porcentajes y reglas de comision historicos guardados. No recalcula ni modifica datos.

## Validacion local

- `node scripts/smoke-sales-return-reconciliation.js`
- `node scripts/smoke-sales-commission-report-v139.js`
- `node scripts/smoke-product-statistics.js`
- `node scripts/smoke-statistics-period.js`
- Sintaxis de `app.js` y `sales-commission-report.js`; `git diff --check`.

## Criterio del corte

Las unidades netas son unidades pedidas menos devoluciones registradas, limitando las devoluciones a la cantidad pedida. Los importes brutos y comisiones mostrados siguen siendo los importes historicos almacenados. El corte anterior citado en la conversacion no coincide con una captura posterior de Crafted; requiere una consulta actualizada para validar esos totales reales.

## Impacto de datos

No hay migracion ni escritura de pedidos, comisiones, saldos o stock. El despliegue cambia codigo de presentacion y version de assets. La publicacion requiere respaldo y reinicio controlado del ERP.
