# Ajuste notificaciones y trazabilidad de pedidos - 2026-06-17

## Estado de fase

Se mantiene la fase:

```text
Fase de modificacion / operacion de pedidos
```

No se avanza de fase porque todavia se esta consolidando el circuito real preventa -> administracion -> deposito -> reparto.

## Requerimiento

- Cada vez que ingrese un pedido desde una cuenta vendedora en celular, los usuarios administradores deben ver una notificacion emergente.
- Administracion debe poder ver la trazabilidad del pedido.
- El sistema debe marcar demoras y urgencias.
- El modulo Pedidos debe mostrar el proceso de despacho y entrega.

## Cambios aplicados

Frontend `8790-15`:

- Pedidos nuevos desde preventa movil quedan marcados con:

```text
source = mobile
origin = preventa
```

- Pedidos manuales desde administracion quedan marcados como:

```text
source = dashboard
origin = dashboard
```

- Cada pedido ahora se normaliza con:

```text
createdAt
receivedAt
updatedAt
priority
trace
```

- Se agrego flujo operativo:

```text
Recibido -> En armado -> Listo reparto -> En reparto -> Entregado
```

- Los administradores reciben un aviso emergente dentro del sistema cuando aparece un pedido nuevo de preventa movil.
- El aviso permite abrir directamente la vista `Pedidos` y resaltar el pedido ingresado.
- Se agrego vibracion si el navegador/dispositivo lo permite.

## Modulo Pedidos

La tabla de pedidos ahora muestra:

- Origen del pedido.
- Hora de ingreso.
- Estado del cliente.
- Proceso operativo.
- Barra de avance por etapas.
- Demora actual.
- Prioridad.
- Acciones:
  - Imprimir hoja.
  - Avanzar etapa.
  - Marcar o retirar urgencia.

El panel lateral ahora muestra:

- Pedidos activos priorizados por urgencia/demora.
- Trazabilidad de los ultimos eventos por pedido.
- Estado de despacho y entrega.

## Reglas de demora

El sistema calcula demoras segun la etapa actual:

```text
Recibido: 20 minutos
En armado: 45 minutos
Listo reparto: 75 minutos
En reparto: 120 minutos
```

Si se supera el umbral, aparece como demora.
Si se duplica el umbral, aparece como demora critica.

## Reglas de urgencia

Un pedido puede aparecer como urgente por:

- Marca manual de administracion.
- Demora critica.
- Cliente excedido de limite.
- Pedido de alto valor.

## Archivos modificados

- `index.html`
- `styles.css`
- `app.js`
- `sw.js`

## Validacion realizada

- `node --check app.js` OK.
- `node --check server.js` OK.
- Version de assets subida a `8790-15`.

## Pendiente

- Probar con dos dispositivos reales: un vendedor desde celular y un administrador con dashboard abierto.
- Definir si las notificaciones deben quedar tambien como historial persistente.
- Definir tiempos reales de demora por deposito/reparto.
- Definir si `Entregado` debe disparar facturacion automatica en una etapa posterior.
