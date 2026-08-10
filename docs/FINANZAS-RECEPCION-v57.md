# Distribuidora Lopez - v57 Finanzas y Recepcion

Fecha: 2026-07-20
Puerto operativo: 8790

## Alcance implementado

Esta version integra dos ajustes operativos:

- Administracion financiera con operaciones masivas sobre comprobantes.
- Flujo acotado de recepcion de remitos para personal receptor.

## Administracion financiera

En la solapa de conciliacion bancaria se agrego:

- seleccion individual de comprobantes.
- seleccionar visibles, deseleccionar e invertir seleccion.
- descarga multiple de comprobantes seleccionados.
- validacion multiple.
- rechazo multiple.
- observacion administrativa multiple.
- filtro de clientes con saldo pendiente.
- visualizacion de observaciones administrativas sobre cada transferencia.

La validacion multiple mantiene la regla ya definida:

- un comprobante recibido no cancela la deuda por si mismo.
- la deuda se cancela solo cuando Administracion valida la transferencia.
- cada accion queda registrada en auditoria, historial financiero y notificaciones.

## Recepcion de mercaderia

Se agrego el rol:

- usuario: recepcion1
- rol: Recepcion
- clave inicial: la definida en la variable DL_DEFAULT_PASSWORD del servidor.

En esta PC, al momento de la verificacion, DL_DEFAULT_PASSWORD esta configurada como:

- cambiar-esta-clave

El sistema agrega este usuario automaticamente al iniciar v57 si no existe en el archivo de usuarios.

El usuario de recepcion solo accede al modulo Proveedores y ve un flujo simple:

- seleccionar proveedor.
- seleccionar productos desde la lista del inventario.
- cargar cantidades.
- sacar foto o adjuntar remito.
- guardar remito.

No visualiza:

- costos.
- precios.
- condiciones comerciales.
- saldos.
- cuenta corriente de proveedores.
- informacion economica sensible.

Los remitos cargados por Recepcion quedan con estado:

- Pendiente validacion administrativa.

Administracion luego puede validar la informacion economica del remito y registrar importe/observaciones.

## Verificacion sugerida

1. Ingresar como admin1.
2. Abrir Conciliacion Bancaria.
3. Seleccionar varios comprobantes.
4. Probar observacion administrativa, rechazo o validacion.
5. Ingresar como recepcion1.
6. Verificar que solo acceda a Proveedores.
7. Cargar un remito con foto y productos.
8. Volver a admin1 y validar el remito desde movimientos de proveedor.

## Resultado operativo

Administracion puede trabajar comprobantes en lote sin operar uno por uno.

Recepcion puede cargar remitos sin acceder a informacion economica, reduciendo errores y manteniendo separacion de permisos.
