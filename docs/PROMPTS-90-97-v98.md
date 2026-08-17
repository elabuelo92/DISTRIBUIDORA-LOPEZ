# Prompts 90 a 97 - Cartera, pedidos, faltantes y reportes

Fecha: 2026-08-17
Version: 8790-98

## Alcance implementado

- Importador XLSX homologado con prioridad por ID, codigo de barras, codigo de proveedor y descripcion exacta.
- Vista previa obligatoria con diferencias por campo, altas pendientes, candidatos a inactivar y errores.
- Backup, confirmacion, motivo y auditoria antes de aplicar; nunca hay borrado fisico.
- Plantilla XLSX oficial de 17 columnas descargable desde `Precios`.
- Importador JSON destructivo deshabilitado.
- Edicion de pedidos con precio de la lista historica del vendedor y comparacion visual antes de guardar.
- Observaciones impresas siempre que existan, respetando saltos de linea.
- Cliente y direccion con mayor jerarquia; cantidad sin negrita; faltantes con asterisco rojo discreto.
- Faltantes a comprar con stock, comprometido, proveedor, subrubro, estado de compra y compra sugerida.
- Exportacion XLSX real de faltantes, pedidos y productos vendidos por ruta.
- Pedidos: exportacion segun filtros en formatos Ventas, Picking, Comisiones y Detalle.
- Reporte de productos vendidos por fecha, ruta/zona, vendedor, categoria y producto, con Excel y PDF.
- Remitos: cierre del dialogo tras exito y bloqueo de proveedor + numero de remito duplicado.
- Busqueda de productos con 600 ms de debounce y prioridad exacta, prefijo y contenido.
- Resultados alfabeticos, filas adaptables, descripcion hasta dos lineas y precio/stock visibles.

## Validacion de la cartera del 17 de agosto

Archivo: `Cartera de producto actualizado al 17 de ago.xlsx`

- 310 productos leidos.
- 278 coincidencias exactas seguras.
- 32 productos requieren homologacion administrativa.
- 375 productos actuales no aparecen en el nuevo archivo y se presentan como candidatos, sin inactivacion automatica.
- 0 errores estructurales en el archivo.

La cartera no se aplica automaticamente mientras existan 32 decisiones pendientes. Esta restriccion evita duplicados y bajas accidentales.

## Pruebas

Ejecutar:

```powershell
node --check server.js
node --check app.js
node scripts\smoke-v98.js
```

La prueba abre el Excel real, valida 310 filas, genera plantilla/reporte XLSX y confirma que el importador antiguo responde HTTP 410.

Tambien se valido visualmente en navegador que al reemplazar `Album Mundial` por `DICLOFENAC 100 X15`, el precio de Lista Nº 2 cambia de $ 8.500 a $ 1.036 y la diferencia se muestra antes de guardar. La prueba se cerro sin modificar el pedido.

## Operacion administrativa

1. `Precios` > `Importar / Actualizar cartera`.
2. Cargar XLSX y previsualizar.
3. Resolver las 32 filas sin homologacion.
4. Revisar los 375 candidatos a inactivar; no marcar en bloque sin validacion comercial.
5. Indicar motivo y confirmar.
6. Aplicar y revisar backup/auditoria.

## Despliegue

Seguir obligatoriamente `docs/PROCEDIMIENTO-CAMBIOS-PRODUCCION-GITHUB.md`: pruebas locales, documentacion, GitHub, backup productivo de `data`, instalacion de dependencias, pull, integridad, reinicio y validaciones.
