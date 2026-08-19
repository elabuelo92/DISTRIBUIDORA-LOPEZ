# Guia - Carga de Stock y Cartera de Productos

Fecha de ultima validacion: 2026-08-18
Sistema: SERVIDOR_UNICO_8790  
URL operativa: https://lopez.gruporochaapp.com

## Estado actual cargado

Archivo validado:

`C:\Users\Distribuidora Lopez\Desktop\Cartera de producto actualizado al 17 de ago.xlsx`

Resultado de la carga:

- 310 productos activos.
- 687 registros historicos totales.
- 278 productos homologados y actualizados.
- 32 productos creados como altas nuevas.
- 377 productos de la cartera anterior inactivados, sin eliminarlos.
- 0 codigos duplicados.
- Stock activo total: 67.600 unidades.
- 5 listas de precios cargadas.
- Lista 1, Lista 2 y Lista 4 con precios para los 310 productos activos.
- Lista 3 con 308 precios y Lista 5 con 92, respetando las celdas vacias del Excel fuente.
- Usuario Kevin asignado y bloqueado a Lista Nro. 4.
- Backup productivo generado antes de modificar datos.

## Metodo 1 - Actualizar solo cantidades de stock desde el sistema

Usar cuando los productos y precios ya estan bien, pero hay que cargar un conteo fisico.

1. Ingresar como administrador.
2. Ir a `Stock e Inventario`.
3. Presionar `Cargar inventario inicial`.
4. Cargar archivo CSV o pegar datos desde Excel.
5. Usar estas columnas:

```csv
codigo_producto;codigo_barras;descripcion;cantidad_fisica;deposito;observacion
950;;Album Mundial;0;Deposito;Conteo actualizado
18;;ALIKAL Oferta;0;Deposito;Conteo actualizado
```

6. Presionar `Vista previa`.
7. Corregir filas con errores.
8. Escribir `CONFIRMAR`.
9. Presionar `Aplicar inventario inicial`.

El sistema genera backup, registra auditoria y deja movimientos en el Libro de Stock.

## Metodo 2 - Homologar cartera completa, costos y listas

Usar cuando cambia el Excel completo de productos, costos, stock y listas.

1. Ingresar como administrador.
2. Ir a `Precios`.
3. En `Cartera integral`, presionar `Importar / Actualizar cartera`.
4. Seleccionar el archivo `.xlsx`.
5. Presionar `Validar y previsualizar`.
6. Revisar las filas `ACTUALIZAR`, `SIN_CAMBIOS` y `REQUIERE_HOMOLOGACION`.
7. Para cada fila sin coincidencia segura, elegir expresamente `Alta nueva` u `Omitir fila`.
8. Revisar los productos actuales ausentes del Excel. Solo marcar para inactivar los confirmados; nunca se eliminan.
9. Escribir el motivo administrativo y marcar la confirmacion.
10. Presionar `Aplicar cambios`.
11. Revisar el resumen, el backup generado, `Stock e Inventario`, `Precios` y una preventa de prueba.

El boton `Descargar plantilla actual` genera el formato homologado de 17 columnas. El viejo importador por PowerShell/JSON quedo deshabilitado porque reemplazaba toda la cartera sin resolver coincidencias.

Plantilla canonica versionada:

`docs\plantillas\PLANTILLA-CARTERA-PRODUCTOS-v99.xlsx`

Columnas obligatorias y orden exacto:

1. `Accion`
2. `ID_Sistema`
3. `Descripcion`
4. `Stock`
5. `Costo`
6. `Lista_1`
7. `Lista_2_Preventa`
8. `Lista_3`
9. `Lista_4`
10. `Lista_5`
11. `Unidad_Medida`
12. `Codigo_Proveedor`
13. `Subrubro`
14. `Categoria`
15. `Codigo_Barras`
16. `Activo`
17. `Observaciones_Importacion`

Para futuras cargas no reutilizar una copia antigua. Descargar siempre la plantilla desde el sistema, completarla sin cambiar encabezados ni agregar hojas protegidas, guardar como `.xlsx` y ejecutar primero `Validar y previsualizar`.

## Diferencia importante

- `Cargar inventario inicial` modifica cantidades de stock.
- `Importar / Actualizar cartera` homologa y actualiza productos sin borrado fisico.

No usar el inventario inicial para cambiar precios.

## Verificacion rapida

Abrir:

https://lopez.gruporochaapp.com/api/health

Debe mostrar:

- `ok: true`
- `version: 8790-99`
- `productsCount: 687` (incluye 377 inactivos conservados por trazabilidad)
- `priceLists: 5`
- `LICENSE_OK`
- `INTEGRITY_OK`

## Respaldo productivo de esta carga

- `/opt/distribuidora-lopez/backups/data-pre-v99-20260818-230600.tar.gz`
- `/opt/distribuidora-lopez/data/backups/2026-08-18T23-52-50-319Z-importar-cartera-homologada`

