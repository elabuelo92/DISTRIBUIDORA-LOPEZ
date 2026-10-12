# Correcciones 169b - 2026-10-12

## Alcance
- Comisiones: reemplazar HTML con extension XLS por XLSX real. Montos, cantidades y porcentajes son celdas numericas; importes con dos decimales. Se conservan filtros, estado de cuenta y pagos.
- Factura/guia: mostrar precio unitario neto desde el importe persistido de la linea dividido por la cantidad. No volver a aplicar descuentos. Importes con dos decimales, incluido cero.
- No modificar pedidos, precios, stock, saldos ni reglas de autorizacion.
- Cache de app.js renovada a 8790-169-r20261012b. Backend permanece 8790-169.

## Pruebas
- smoke-commission-numeric-export: XLSX real leido con ExcelJS, numeros, formatos, pagos, filtros, negativos/cero e inmutabilidad.
- smoke-invoice-net-price: descuento aprobado, cambio de precio, solicitud pendiente, bonificacion total, fracciones, cantidad cero, datos antiguos y precios ocultos.
- smoke-preventa-line-discounts: aprobacion, rechazo, vinculacion por ID y no duplicacion.
- smoke-readable-exports y smoke-tabular-exports: regresion de exportaciones.

## Aceptacion operativa
- Exportar nuevamente Comisiones; comprobar extension .xlsx y sumar Monto bruto en Excel.
- Reimprimir pedido con descuento aprobado; comprobar unitario neto y subtotal original.
- Ejemplo: 12 unidades, lista 1508, descuento 20%: unitario 1206,40, importe 14476,80.
- Pedidos pendientes/rechazados conservan importes guardados, sin aplicar solicitudes pendientes.
- No usar archivos exportados previamente para validar la correccion.
- Un unitario mostrado a dos decimales puede producir diferencias de centavos al multiplicarlo por cantidades: el importe de linea conserva la precision persistida.

Despliegue: requiere respaldo verificado, integridad y comprobacion de datos antes/despues. La publicacion se confirma separadamente luego de ejecutar esos pasos.
