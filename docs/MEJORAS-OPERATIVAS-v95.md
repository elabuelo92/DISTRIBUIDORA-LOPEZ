# Mejoras operativas v95

Fecha: 14/08/2026

## Alcance

- Los avisos operativos continúan guardándose en `Avisos` y actualizando su contador, pero ya no abren notificaciones flotantes sobre el tablero.
- La ventana de abastecimiento incorpora `Imprimir lista de compra`, con las columnas Unidad, Producto, Costo y Lista 2.
- La factura/guía para Armado utiliza un formato compacto: se eliminó el estado del pedido, se redujeron espacios y los faltantes se identifican únicamente con un asterisco rojo junto al producto.
- Las reglas personales de comisión admiten una tasa para un rubro y otra tasa general para el resto de los productos.
- Las reglas generales personales quedan aisladas por usuario y nunca pueden convertirse en la tasa predeterminada de otros vendedores.
- Los pedidos nuevos guardan el nombre visible y el nombre de usuario del vendedor para mantener una identificación estable.
- La edición del nombre visible de un vendedor propaga el cambio a pedidos, cartera asignada, reglas de comisión y asignaciones de listas, conservando importes históricos.
- Se agregó un recálculo administrativo acotado por vendedor y rango de fechas. El proceso excluye comisiones marcadas como liquidadas y genera auditoría por pedido.
- Al reemplazar un producto durante la edición de una Preventa, el selector compara códigos numéricos y alfanuméricos de forma normalizada y aplica inmediatamente el precio de la lista asignada. Ya no puede caer silenciosamente en el primer producto de la cartera.

## Política aplicada a las comisiones

Para Axel (`david`), Lisandro y Matías:

- Cigarrillos: 2 %.
- Resto de productos: 5 %.

El cambio de reglas no modifica por sí solo pedidos existentes. Para esta puesta en producción se ejecuta una única corrección auditada sobre las ventas del 14/08/2026. Los pedidos de días anteriores quedan sin cambios.

## Pruebas

Ejecutar:

```powershell
node --check app.js
node --check order-engine.js
node --check server.js
node scripts/smoke-v95.js
```

La prueba `smoke-v95.js` valida prioridad y aislamiento de reglas personales, cálculo línea por línea, protección de pedidos fuera del rango solicitado y el recálculo de precio al reemplazar productos.
