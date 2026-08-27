# Proveedores y precios masivos v115

Fecha: 27/08/2026

## Alcance

- Edicion de datos de proveedores desde el boton `Editar` existente.
- Nueva accion `Eliminar / inactivar` con inspeccion previa de dependencias.
- Baja fisica permitida solamente cuando el proveedor no tiene productos, remitos, pagos, movimientos de stock, movimientos embebidos ni saldo.
- Inactivacion obligatoria cuando existe trazabilidad. Los vinculos historicos se conservan.
- Motivo y revalidacion de clave administrativa obligatorios.
- Auditoria y aviso administrativo para toda baja o inactivacion.
- Correccion de cambios masivos de precios por proveedor.

## Causa del cambio masivo incorrecto

La interfaz conservaba la ultima simulacion aun cuando el administrador cambiaba el proveedor o el porcentaje. Al aplicar, podia confirmar una seleccion nueva pero enviar la simulacion anterior. Ademas, la coincidencia exigia que el proveedor del producto fuera exactamente igual a la razon social seleccionada.

## Correccion

- La simulacion se invalida ante cualquier cambio del formulario.
- La aplicacion siempre recalcula la seleccion actual antes de confirmar.
- El servidor vuelve a calcular de manera autoritativa.
- La coincidencia contempla razon social, nombre comercial y CUIT del proveedor.
- Los descuentos porcentuales negativos se prueban como disminucion del precio vigente.

## Politica de eliminacion

1. El sistema informa productos, remitos, pagos, movimientos y saldo relacionados.
2. Sin relaciones: permite eliminacion permanente.
3. Con relaciones: bloquea eliminacion permanente y ofrece inactivacion.
4. La inactivacion no desvincula ni reescribe operaciones historicas.
5. Toda accion requiere motivo y clave del administrador.

## Prueba automatizada

Ejecutar:

```powershell
npm.cmd run test:suppliers-prices
```

Valida:

- descuento de 10 % por proveedor usando razon social contra producto cargado con nombre comercial;
- producto ajeno sin cambios;
- bloqueo de baja fisica con dependencias;
- inactivacion con historial preservado;
- eliminacion de proveedor sin relaciones.

## Estado de despliegue

Implementado localmente. El despliegue productivo debe realizarse despues de las 18:00 ART, con backup, actualizacion desde GitHub, regeneracion de integridad, reinicio controlado y validacion de `/api/health`.
