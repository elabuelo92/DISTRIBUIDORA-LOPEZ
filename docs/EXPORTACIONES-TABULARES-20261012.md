# Exportaciones tabulares

Bloque 1: Stock fisico, ajustes de inventario, Stock, carteras completas de
clientes y productos, listas de precios, proveedores y manifiestos de ruta.

Se reemplaza la descarga CSV de estos accesos por XLSX real mediante el endpoint
existente. No cambian filtros, permisos ni datos de negocio. Se mantienen todos
los campos del origen, valores numericos y codigos de texto. Los botones ahora
indican Excel. Se conserva el generador CSV para exportaciones no revisadas.

Stock fisico contiene 18 columnas con nombres legibles; ajustes contiene 6.
Letra 13, encabezados y filtros existentes, panel congelado y texto ajustado.

Pruebas: smoke-tabular-exports.js, smoke-collection-workbook-layout.js,
smoke-route-collection-scope.js y smoke-payment-preset-preservation.js.

Pendientes: inspeccion visual autenticada de cada exportacion y vista impresa;
revisar PDF de stock fisico/stock y resto de reportes que usan texto corrido.
Los PDF no fueron modificados en este bloque. No afirmar que todas las
exportaciones del sistema estan corregidas.
