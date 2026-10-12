# Exportaciones restantes - 12 de octubre de 2026

## Alcance

- PDF tabular: Mis ventas, armado, hoja comercial, faltantes, ventas por ruta,
  auditoria, recorridos GPS, cortes de pedidos, carteras, precios, comisiones y proveedores.
- Filas de altura variable, encabezados repetidos y fuente de 9 puntos.
- En PDF con mas de ocho campos se agrupan columnas, conservando etiquetas y valores.
- CSV de ventas, seleccion de pedidos, armado, comisiones, cartera comercial,
  comprobantes y GPS: BOM UTF-8 y separador explicito para Excel.
- Los XLSX existentes conservan una columna por campo. CSV sigue siendo CSV,
  no se disfraza como XLSX ni se amplian permisos del endpoint de reportes.
- Auditoria conserva su limite de 300 registros y ahora lo informa.
- Manual de ayuda conserva su formato de documento, no es una tabla.

## Pruebas locales

Pasaron smoke-readable-exports, smoke-tabular-exports, smoke-manifest-pdf-layout,
smoke-stock-pdf-layout, smoke-portfolio-pdf-v137,
smoke-collection-workbook-layout y smoke-route-collection-scope.

Se verificaron 400 filas en cuatro anchos de tabla, valores completos, reportes
vacios, comillas/separadores, ceros y ausencia de mutacion de los datos fuente.
Se ejecutaron descargas de vendedor, seleccion, armado y comisiones sin API
privilegiada. Render visual del PDF ancho revisado sin superposiciones.

## Limites y despliegue

Los CSV no garantizan tipos de celda al abrirlos con Excel (usar XLSX existente
cuando sea necesario preservar identificadores como texto). El separador explicito
esta destinado a Excel; otros importadores deben omitir la primera linea sep=;.
No se cambian calculos, filtros, saldos, stock, pedidos ni permisos.
Lote aislado de los cambios de reasignacion de rutas en desarrollo.
Autorizacion excepcional recibida para despliegue antes de las 18 con respaldo.
El resultado de produccion debe verificarse por separado de estas pruebas locales.
