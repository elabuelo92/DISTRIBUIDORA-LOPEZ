# Restauracion selectiva de pedidos - 8790-139

Fecha: 07/09/2026

## Alcance autorizado

- Reactivar pedidos de Axel y Ruggero desde el 04/09/2026.
- Restaurar solamente estados procesables: `En Preparacion` y `Listo para Despacho`.
- Preservar como historicos los pedidos ya `Despachado` o `En Reparto`.
- No restaurar rutas historicas.
- Mantener pedidos nuevos y evitar codigos duplicados.

## Controles

- La restauracion exige motivo, vendedores, fecha y cantidad esperada.
- Antes de modificar el archivo se valida stock producto por producto.
- Los pedidos activos existentes tienen prioridad sobre la reserva restaurada.
- Si falta un producto o stock, no se aplica ningun cambio.
- El comando genera backup y escribe el estado en forma atomica.
- Clientes, proveedores, comisiones, conciliaciones y stock fisico no se modifican.

## Historial visible

En `Pedidos` se agrega el selector:

- `Operativos`: pedidos activos y habilitados para trabajar.
- `Historicos (solo lectura)`: pedidos archivados con filtros, busqueda y trazabilidad, sin acciones operativas.

Armado y Despacho continúan utilizando exclusivamente pedidos activos.
