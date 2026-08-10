# Modulo de trazabilidad completa de pedidos - v40

Fecha: 2026-07-05

## Objetivo

Centralizar la historia completa de cada pedido para que Administracion pueda reconstruir que paso, quien lo hizo, cuando, desde que dispositivo y con que evidencia.

## Alcance implementado

- Boton `Trazabilidad` en cada fila del modulo Pedidos.
- Modal con linea de tiempo completa por pedido.
- Consolidacion de eventos desde:
  - `order.trace`
  - auditoria global
  - auditoria de reparto
  - historial de edicion administrativa
  - cobranzas registradas
  - comprobantes y conciliacion bancaria
- Visualizacion de:
  - estado
  - fecha y hora
  - usuario
  - origen del evento
  - IP si corresponde
  - dispositivo si corresponde
  - GPS si corresponde
  - observaciones y notas

## Eventos cubiertos

- Pedido creado.
- Pedido modificado.
- Pedido preparado.
- Pedido armado.
- Pedido despachado.
- Inicio del reparto.
- Ubicacion GPS.
- Entrega.
- Cobranza.
- Carga de comprobante.
- Validacion o rechazo de comprobante.
- Cierre.
- Cancelacion.
- Devoluciones y entregas parciales.

## Persistencia adicional

Se agrego escritura explicita en la traza del pedido para:

- Evidencias de reparto cargadas.
- Comprobantes de transferencia subidos.
- Cambios de estado de transferencias en conciliacion bancaria.

Esto evita que esos eventos queden solamente en auditoria global y permite verlos dentro del pedido.

## Archivos modificados

- `app.js`
- `index.html`
- `styles.css`
- `server.js`
- `order-engine.js`
- `sw.js`

## Prueba recomendada

1. Ingresar como Administrador.
2. Abrir `Pedidos`.
3. Presionar `Trazabilidad` en cualquier pedido.
4. Verificar que la linea de tiempo muestre estados, auditoria y usuario.
5. En Reparto, subir foto o comprobante.
6. Volver al pedido y confirmar que aparece el evento de evidencia/comprobante.
7. Validar o rechazar una transferencia y confirmar que el evento aparece en la trazabilidad del pedido.

