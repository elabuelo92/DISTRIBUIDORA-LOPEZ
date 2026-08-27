# V116 - Descuentos aprobados, Lista 1 y PDF comercial

Fecha: 27/08/2026

## Objetivo

1. Garantizar que una aprobacion comercial aplique el descuento al pedido y se vea inmediatamente en Administracion.
2. Generar Lista Nº 1 como Lista Nº 2 menos 8%, sin modificar Lista Nº 2 ni pedidos historicos.
3. Exportar cualquiera de las listas 1 a 5 en PDF para compartir con clientes.

## Correccion de aprobacion comercial

El servidor recalcula las lineas, el total y las comisiones. Antes de guardar, valida que una aprobacion con descuento mayor a cero reduzca efectivamente el importe. Si no lo hace, rechaza la operacion y no persiste un estado inconsistente.

La API responde ahora con el pedido actualizado y con:

- `amountBefore`
- `amountAfter`
- `discountApplied`

La consola reemplaza inmediatamente su copia local del pedido. El aviso confirma el total anterior y el total nuevo.

## Generar Lista Nº 1

Ruta de uso:

1. Ingresar como administrador.
2. Abrir `Precios`.
3. Presionar `Generar Lista 1 (-8% de Lista 2)`.
4. Confirmar la cantidad de productos.
5. Indicar el motivo administrativo.

Formula:

```text
Lista 1 = Lista 2 x 0,92
```

La operacion:

- conserva Lista Nº 2;
- no cambia el precio historico de pedidos confirmados;
- registra usuario, fecha, motivo, precio anterior y precio nuevo;
- exige confirmacion administrativa.

## Exportar lista para clientes

En `Precios`:

1. Seleccionar Lista Nº 1, 2, 3, 4 o 5.
2. Presionar `Exportar lista PDF`.

El PDF contiene:

- codigo;
- producto;
- precio;
- vigencia y version del sistema.

No contiene costos, stock ni proveedor.

## Pruebas automatizadas

Comando:

```powershell
npm.cmd run test:commercial-prices
```

Casos verificados:

- pedido $2.000 con descuento aprobado de 10% termina en $1.800;
- descuento aplicado informado: $200;
- Lista 2 $1.000 genera Lista 1 $920;
- Lista 2 $2.500 genera Lista 1 $2.300;
- Lista Nº 2 permanece sin cambios;
- el precio vigente general permanece sin cambios;
- el pedido historico conserva $1.800 luego de generar la lista;
- exportacion PDF disponible en la interfaz.

Tambien pasaron las regresiones de comisiones, flujo de armado/pedidos y proveedores/precios.

## Estado de despliegue

Implementado localmente, probado y pendiente de despliegue productivo despues de las 18:00 ART para no interrumpir la operacion.
