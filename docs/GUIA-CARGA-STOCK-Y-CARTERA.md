# Guia - Carga de Stock y Cartera de Productos

Fecha de ultima validacion: 2026-08-11  
Sistema: SERVIDOR_UNICO_8790  
URL operativa: https://lopez.gruporochaapp.com

## Estado actual cargado

Archivo validado:

`C:\Users\Distribuidora Lopez\Downloads\STOCK ACTUALIZADO.xlsx`

Resultado de la carga:

- 653 productos cargados.
- 0 codigos duplicados.
- Stock total: 52.582 unidades.
- 5 listas de precios cargadas.
- Cada lista contiene 653 productos.
- Usuario Kevin asignado a Lista NÃ‚Âº 4.
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

## Metodo 2 - Reemplazar cartera completa, costos y listas

Usar cuando cambia el Excel completo de productos, costos, stock y listas.

1. Guardar el Excel en una carpeta conocida.
2. Abrir PowerShell en la PC administrativa o servidor.
3. Ejecutar:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
powershell.exe -ExecutionPolicy Bypass -File .\scripts\import-product-portfolio.ps1 -ExcelPath "C:\ruta\archivo.xlsx" -PythonExe "C:\Users\Distribuidora Lopez\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
```

4. Confirmar que la salida indique `ok: true`.
5. Abrir el sistema.
6. Revisar `Stock e Inventario`.
7. Revisar `Precios`.
8. Probar un pedido preventa con un vendedor.

## Diferencia importante

- `Cargar inventario inicial` modifica cantidades de stock.
- `import-product-portfolio.ps1` reemplaza cartera completa y listas de precios.

No usar el inventario inicial para cambiar precios.

## Verificacion rapida

Abrir:

https://lopez.gruporochaapp.com/api/health

Debe mostrar:

- `ok: true`
- `productsCount: 653`
- `priceLists: 5`
- `LICENSE_OK`
- `INTEGRITY_OK`

## Respaldo productivo de esta carga

`/opt/distribuidora-lopez/data/backups/2026-08-11T13-21-51-947Z-stock-actualizado`

