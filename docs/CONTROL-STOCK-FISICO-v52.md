# Control de Stock Fisico - v52

Fecha: 2026-07-13

## Objetivo

Separar dos conceptos operativos:

- Stock disponible para venta: se descuenta al confirmar la preventa para evitar sobreventas.
- Stock fisico para control e inventario: representa la mercaderia que todavia deberia estar dentro del deposito.

## Criterio de calculo

El stock disponible no se modifica.

Para inventario, el sistema vuelve a sumar la mercaderia comprometida en pedidos que todavia no fueron despachados:

Stock fisico esperado = stock disponible + mercaderia no despachada.

Estados considerados como mercaderia fisicamente en deposito:

- Pendiente.
- Confirmado / Completo para armado.
- En preparacion.
- Armado.
- Etiquetado.
- Listo para despacho.

Estados que ya no se suman al stock fisico:

- Despachado.
- En reparto.
- Entregado.
- Cancelado.

## Modulo agregado

Se agrego la solapa administrativa:

Control Stock

Permite:

- Consultar producto individual.
- Consultar rubro, marca, proveedor o deposito.
- Ver stock disponible, comprometido, preparandose, armado, etiquetado y pendiente de despacho.
- Calcular stock fisico esperado.
- Iniciar corte de stock.
- Cargar conteo fisico.
- Calcular diferencia y porcentaje.
- Exportar reportes CSV/PDF.
- Ver trazabilidad por producto, pedido, cliente, estado, fecha y usuario.

## Ajustes

Los ajustes requieren autorizacion con clave de administrador.

Cada ajuste registra:

- Producto.
- Stock anterior.
- Stock nuevo.
- Motivo.
- Usuario.
- Fecha.
- Hora.

El historial no se elimina.

## Version

Servidor activo:

DLPreventaServer-UNICO-8790-2026-07-13-v52-CONTROL-STOCK-FISICO

URL local:

http://127.0.0.1:8790/index.html?v=8790-52#control-stock
