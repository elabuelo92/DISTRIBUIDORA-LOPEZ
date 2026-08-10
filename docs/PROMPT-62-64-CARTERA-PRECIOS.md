# Prompt 62-64 - Cartera, listas y limpieza controlada

## Estado implementado

- El sistema administra productos con codigo interno, codigo de barras, rubro, marca, proveedor, costo, stock, estado y precios por Lista Nº 1 a Nº 5.
- Las listas operativas se generan desde las columnas `precio_lista_1` a `precio_lista_5`.
- Kevin queda asignado por defecto a `Lista Nº 4`.
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
- reconstruye listas Nº 1 a Nº 5,
- mantiene Kevin en Lista Nº 4,
- registra auditoria de importacion.

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
