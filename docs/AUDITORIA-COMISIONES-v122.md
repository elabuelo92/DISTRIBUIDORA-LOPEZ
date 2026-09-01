# Auditoria integral de comisiones v122

Fecha de lectura productiva: 01/09/2026 01:29 UTC. La inspeccion fue de solo lectura y no recalculo ni modifico ventas.

## Inventario

- Vendedores: 10 activos de 10.
- Pedidos: 215.
- Reglas: 14 activas, 0 inactivas.
- Reglas generales: 5.
- Conflictos de vigencia: 1.

## Caso Axel

Axel es un unico vendedor con usuario `david`. Se detectaron:

- `COM-SELLER-AXEL-RESTO`: 5% general, vigente desde 14/08/2026.
- `COM-1788209458264-2578`: 4% general, vigente desde 01/09/2026.
- `COM-SELLER-AXEL-CIG`: 1% cigarrillos, vigente desde 01/09/2026.

Las dos reglas generales se superponen desde el 01/09. El sistema anterior no detectaba el conflicto porque una regla se identificaba por username y la otra solamente por nombre visible. Las ventas de agosto revisadas conservaron snapshots de la regla del 5%; no se recalcularon.

Decision administrativa pendiente: confirmar si desde septiembre debe regir 4% o 5% para mercaderia general. La correccion de datos productivos debe cerrar la regla descartada, no borrarla.

## Caso Ruggero

Ruggero es un unico vendedor activo con usuario `ruggero david`. No posee regla especifica visible ni historica en el conjunto actual. Sus ventas recientes se calcularon mediante:

- regla general vendedores: 3% para mercaderia;
- regla general cigarrillos: 1%;
- una regla general de producto al 10% cuando corresponde a Detergente Mister Burbuja 500 ml.

No se creo una regla nueva porque falta definir administrativamente los porcentajes propios de Ruggero.

## Correcciones de software

- Deteccion de identidad por username y nombre de vendedor.
- Bloqueo en servidor de reglas activas equivalentes con vigencias superpuestas.
- Edicion versionada: cierra la regla anterior como historica y crea una nueva vigencia.
- Conservacion del snapshot de porcentaje y regla en cada venta.
- Diagnostico visible de conflictos en Administracion.
- Etiqueta explicita `Regla general para todos los vendedores`.
- Resumen mensual del vendedor separado de la jornada diaria.
- Consulta de meses anteriores sin borrar datos.

## Pruebas

`npm.cmd run test:commission-governance`

Valida conflicto Axel, rechazo de duplicado, una unica regla vigente tras editar y separacion agosto/septiembre.
