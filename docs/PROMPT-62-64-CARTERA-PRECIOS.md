# Prompt 62-64 - Cartera, listas y limpieza controlada

## Estado implementado

- El sistema administra productos con codigo interno, codigo de barras, rubro, marca, proveedor, costo, stock, estado y precios por Lista Nro 1 a Nro 5.
- Las listas operativas se generan desde las columnas `precio_lista_1` a `precio_lista_5`.
- Kevin queda asignado por defecto a `Lista Nro 4`.
- Preventa calcula y envia el pedido con la lista asignada al usuario.
- El servidor vuelve a validar la lista asignada antes de grabar el pedido.
- El modulo `Precios` incluye panel de cartera, asignacion de listas y mantenimiento.

## Importar cartera desde Excel

Copiar el Excel al servidor, por ejemplo:

`C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\importaciones\Stock mercaderia.xlsx`

Ejecutar en PowerShell:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
powershell.exe -ExecutionPolicy Bypass -File .\scripts\import-product-portfolio.ps1 -ExcelPath ".\importaciones\Stock mercaderia.xlsx"
```

El importador:

- detecta encabezados del Excel,
- reemplaza la cartera de productos,
- genera backup previo,
- reconstruye listas Nro 1 a Nro 5,
- mantiene Kevin en Lista Nro 4,
- registra auditoria de importacion.

## Carga validada 2026-08-11

Archivo utilizado:

`C:\Users\Distribuidora Lopez\Downloads\STOCK ACTUALIZADO.xlsx`

Resultado:

- Productos cargados: 653.
- Codigos duplicados detectados: 0.
- Stock total importado: 52.582 unidades.
- Listas reconstruidas: Lista 1, Lista 2, Lista 3, Lista 4 y Lista 5.
- Productos por lista: 653.
- Kevin queda bloqueado por defecto en Lista NÃ‚Âº 4.

Backups generados:

- Local: `data\backups\20260811-130736-importar-cartera-productos`
- Produccion Vultr: `/opt/distribuidora-lopez/data/backups/2026-08-11T13-21-51-947Z-stock-actualizado`

Validacion productiva:

- URL publica `/api/health`: OK.
- `productsCount`: 653.
- `priceLists`: 5.
- Integridad: `INTEGRITY_OK`.
- Licencia: `LICENSE_OK`.

## Procedimiento sin Codex

### Si cambia toda la cartera de productos y precios

Usar este metodo cuando se reemplazan productos, costos o listas de precios.

1. Guardar el Excel actualizado en una carpeta conocida.
2. Abrir PowerShell.
3. Ejecutar:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
powershell.exe -ExecutionPolicy Bypass -File .\scripts\import-product-portfolio.ps1 -ExcelPath "C:\ruta\archivo.xlsx" -PythonExe "C:\Users\Distribuidora Lopez\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
```

4. Verificar que informe `ok: true`.
5. Abrir el sistema como administrador.
6. Ir a `Stock e Inventario` y confirmar cantidad de productos, stock y precios.
7. Probar un pedido con Kevin y verificar que tome Lista NÃ‚Âº 4.

### Si solo cambia el conteo fisico de stock

Usar este metodo cuando la cartera y los precios ya son correctos, pero se quiere actualizar cantidad fisica.

1. Entrar al sistema con usuario administrador.
2. Ir a `Stock e Inventario`.
3. Presionar `Cargar inventario inicial`.
4. Cargar un CSV o pegar datos con columnas:

```csv
codigo_producto;codigo_barras;descripcion;cantidad_fisica;deposito;observacion
950;;Album Mundial;0;Deposito;Conteo actualizado
```

5. Presionar `Vista previa`.
6. Corregir cualquier fila marcada en rojo.
7. Escribir `CONFIRMAR`.
8. Presionar `Aplicar inventario inicial`.

El sistema genera backup previo y registra movimientos de stock. No usar este metodo para cambiar precios o reemplazar productos.

## Limpieza de produccion

Desde `Precios > Cartera integral`, Administracion puede:

- limpiar pedidos,
- limpiar clientes,
- asignar lista por vendedor.

Cada limpieza solicita:

- motivo,
- confirmacion escrita `CONFIRMAR`,
- backup automatico,
- auditoria.

No se eliminan configuraciones del sistema.

