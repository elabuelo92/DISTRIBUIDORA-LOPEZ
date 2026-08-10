# Arquitectura preparada para escalar mediante eventos - v41

Fecha: 2026-07-05

## Objetivo

Preparar el sistema para que los modulos actuales y futuros trabajen mediante eventos internos, evitando que nuevas funciones obliguen a modificar la logica central de pedidos, stock, reparto o cobranza.

## Implementacion

Se agrego el motor `event-engine.js`.

El servidor ahora genera eventos de dominio a partir de:

- Auditoria global.
- Notificaciones internas.
- Cambios sincronizados por `/api/state`.
- Carga de evidencias.
- Conciliacion bancaria.

Cada evento queda guardado en:

- `state.domainEvents`

Y cada posible integracion futura queda preparada en:

- `state.integrationOutbox`

El outbox no envia nada todavia. Queda en estado `queued-disabled` hasta configurar cada conector.

## Endpoint tecnico

Administracion puede consultar:

`GET /api/events`

Filtros soportados:

- `entityType`
- `entityId`
- `type`
- `module`
- `target`
- `limit`

Ejemplos:

- `/api/events?entityType=pedido&entityId=PED-2080`
- `/api/events?type=payment.receipt.uploaded`
- `/api/events?target=arca_facturacion`

## Tipos de eventos principales

- `order.created`
- `order.updated`
- `order.status.changed`
- `order.dispatched`
- `order.delivered`
- `order.cancelled`
- `stock.changed`
- `client.updated`
- `client.sensitive.changed`
- `route.planned`
- `route.published`
- `route.started`
- `route.closed`
- `delivery.status.changed`
- `delivery.completed`
- `delivery.evidence.uploaded`
- `payment.receipt.uploaded`
- `payment.receipt.validated`
- `payment.receipt.rejected`
- `payment.transfer.status.changed`
- `credit.limit.exceeded`

## Integraciones preparadas

El outbox deja preparado el destino futuro segun el evento:

- `arca_facturacion`
- `whatsapp`
- `email`
- `conciliacion_bancaria`
- `ocr_comprobantes`
- `ia_validacion`
- `geolocalizacion_tiempo_real`
- `portal_cliente`
- `ia_reposicion_stock`

## Ventaja operativa

A partir de este corte, una futura funcionalidad puede escuchar eventos sin tocar el flujo existente.

Ejemplos:

- Al emitirse `order.delivered`, luego se puede generar facturacion ARCA.
- Al emitirse `payment.receipt.uploaded`, luego se puede ejecutar OCR o IA.
- Al emitirse `route.started`, luego se puede enviar WhatsApp o actualizar portal cliente.
- Al emitirse `stock.changed`, luego se puede sugerir reposicion automatica.

## Archivos modificados

- `event-engine.js`
- `server.js`
- `index.html`
- `app.js`
- `sw.js`

## Prueba recomendada

1. Ingresar como Administrador.
2. Crear o modificar un pedido.
3. Consultar `/api/events`.
4. Confirmar que aparece un evento `order.created`, `order.updated` o `order.status.changed`.
5. Revisar que `integrationOutbox` tenga entradas deshabilitadas para integraciones futuras.

