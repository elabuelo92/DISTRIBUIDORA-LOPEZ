# Filtro historico de pedidos v96

## Objetivo

La pestaña Pedidos muestra por defecto los pedidos del dia actual, pero conserva acceso inmediato a jornadas anteriores sin borrar registros ni trazabilidad.

## Uso

En `Pedidos`, utilizar el selector `Periodo`:

- `Hoy`: operacion diaria predeterminada.
- `Ayer`: jornada anterior.
- `Ultimos 7 dias`: periodo movil de siete dias.
- `Este mes`: desde el primer dia del mes hasta hoy.
- `Personalizado`: habilita cualquier fecha desde/hasta.
- `Todo el historial`: muestra todos los pedidos disponibles.

Los campos `Desde` y `Hasta` permiten elegir un solo dia usando la misma fecha o un rango completo. El boton `Limpiar` restablece el periodo a `Hoy` y limpia los demas filtros.

## Regla de fecha

El pedido se asigna a la fecha en la que fue creado o recibido. Una modificacion posterior de estado, precio o armado no cambia el dia historico al que pertenece.

## Alcance

- No elimina pedidos a las 00:00.
- No modifica stock, estados, comisiones ni rutas.
- Mantiene paginacion, seleccion masiva, impresion y exportacion sobre el periodo filtrado.
- El resumen visible confirma el periodo activo y la cantidad de pedidos encontrados.
