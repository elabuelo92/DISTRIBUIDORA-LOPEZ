# Prompt 88 - Proveedores, remitos y stock controlado

Fecha: 2026-08-13

## Objetivo

Completar el circuito de ingreso de mercaderia desde proveedores:

Proveedor -> Remito -> Producto existente o nuevo -> Cantidades -> Validacion administrativa -> Costo/listas -> Stock.

## Implementado

- Se agrego alta formal de proveedor desde el modulo Proveedores con el boton `+ Nuevo proveedor`.
- El alta registra razon social, nombre comercial, CUIT, domicilio, localidad, provincia, telefono, WhatsApp, email, contacto, condicion de pago, datos bancarios, observaciones y estado operativo.
- El backend valida CUIT duplicado y advierte posibles duplicados por razon social o nombre comercial.
- El proveedor creado queda disponible inmediatamente para remitos.
- En carga de remitos se agrego `+ Crear producto nuevo` sin salir del remito.
- El producto nuevo permite descripcion, codigo interno opcional, codigo de barras, marca, rubro/categoria, proveedor, unidad de venta y foto opcional desde camara/galeria.
- Se incorporo calculo de presentacion:
  - unidades por blister;
  - blisters por bulto/caja;
  - bultos/cajas recibidas;
  - total de unidades recibidas.
- Los productos nuevos quedan en estado `Pendiente de validacion`, inactivos para venta y con stock cero.
- El stock no aumenta al cargar el remito.
- En conciliacion administrativa del remito se muestra la grilla de productos, costos y listas.
- Los productos nuevos exigen validacion de costo y listas antes de ingresar stock.
- Los productos existentes permiten actualizar costo/listas solo si Administracion marca esa opcion.
- Al validar remito se crea movimiento `INGRESO POR REMITO DE PROVEEDOR`.
- Se mantiene auditoria global para proveedor creado, remito cargado, producto pendiente, producto validado y remito validado.
- Se retiro el QR de la configuracion de impresion de Armado. El codigo de barras de etiquetas se conserva.

## Flujo operativo

1. Administracion crea el proveedor desde `Proveedores -> + Nuevo proveedor`.
2. Recepcion o Administracion carga un remito y adjunta foto/PDF obligatorio.
3. Si el producto existe, lo selecciona desde el inventario.
4. Si el producto no existe, usa `+ Crear producto nuevo`.
5. Completa presentacion y bultos para calcular unidades.
6. Guarda el remito. Queda pendiente; no modifica stock.
7. Administracion entra en `Conciliar remito`.
8. Completa factura, importe, costo y listas si corresponde.
9. Al validar, el sistema ingresa stock y actualiza cuenta del proveedor.

## Pruebas realizadas

- `node --check app.js`
- `node --check server.js`
- `node --check order-engine.js`
- Smoke test temporal en puerto `8898` con copia de datos:
  - login admin OK;
  - alta de proveedor OK;
  - remito con producto nuevo OK;
  - estado pendiente de validacion OK;
  - validacion administrativa OK;
  - stock ingresado OK.

## Nota de integridad

El sistema tiene blindaje de integridad activo. Luego de modificar archivos criticos se regenero:

`C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\data\integrity-manifest.json`

Estado verificado:

- Licencia: OK.
- Integridad: OK.

