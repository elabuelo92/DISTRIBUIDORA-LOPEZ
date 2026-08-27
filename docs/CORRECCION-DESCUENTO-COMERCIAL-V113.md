# Correccion de descuento comercial - v113

Fecha: 27/08/2026

## Incidente

El pedido `PED-2211` recibio y registro correctamente la aprobacion de un descuento general del 100%. Al normalizar el estado durante un avance posterior, el motor interpreto el importe numerico `0` como ausente, restauro el total bruto y descarto los campos de descuento de las lineas.

## Correccion

- Los importes explicitos en cero se conservan como valores validos.
- La normalizacion mantiene porcentaje, importe de descuento, precio original y metadatos operativos de cada linea.
- Las aprobaciones comerciales resueltas se reaplican de manera idempotente cuando se detecta una inconsistencia historica.
- La comision se recalcula sobre el importe neto corregido. Un pedido con descuento del 100% genera importe y comision iguales a cero.
- No se modifican reservas, stock fisico, bultos, etiquetas ni estado logistico.

## Validacion

La prueba automatizada cubre:

- descuento parcial;
- descuento total;
- aprobacion administrativa;
- normalizaciones repetidas;
- total y comision en cero despues de recargar el estado.

## Reparacion de produccion

Al cargar el estado con v113, `PED-2211` recupera la aprobacion ya auditada y queda con total neto y comision en cero. La trazabilidad comercial y logistica existente se conserva.
