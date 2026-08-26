# Diagnostico de proveedores en Listas de Precios - v112

Fecha: 26/08/2026

## Problema

El selector `Precios > Cambio controlado > Masivo por proveedor` mostraba solo una parte del padron.

## Causa raiz

La interfaz construia el desplegable exclusivamente con `product.proveedor`. Los proveedores creados desde el modulo Proveedores que todavia no estaban asociados a ningun producto no podian aparecer.

Diagnostico de solo lectura en produccion:

- 24 registros en el padron de proveedores;
- 7 nombres distintos vinculados a productos;
- 16 registros del padron sin coincidencia directa con los proveedores escritos en productos;
- duplicados nominales detectados en el padron, que se presentan una sola vez en el selector.

## Correccion

El catalogo del selector combina ahora:

1. el padron oficial `state.suppliers`;
2. los proveedores historicos presentes en `state.products`.

Los nombres se limpian, se eliminan duplicados exactos y se ordenan alfabeticamente. La misma fuente se utiliza para el filtro de proveedores de Listas de Precios.

## Seguridad de datos

La correccion no asigna productos automaticamente, no modifica precios, costos, saldos, remitos ni cuentas corrientes. Seleccionar un proveedor sin productos vinculados producira una simulacion con cero productos afectados hasta que exista una asociacion real.

## Recomendacion pendiente

Administracion debe revisar los proveedores duplicados y completar la asociacion real de productos desde el circuito Proveedor > Remito > Producto. No se deben inferir asociaciones por similitud de nombres.
