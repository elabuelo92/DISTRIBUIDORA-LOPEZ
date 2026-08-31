# Historial de cliente movil v120

## Objetivo

La ficha de cliente en Preventa consulta su historial sin recorrer ni renderizar todos los pedidos disponibles en el estado local.

## Funcionamiento

- `GET /api/clients/:clientId/history?page=1&limit=5` devuelve el resumen y una pagina compacta de pedidos.
- `GET /api/clients/:clientId/history/:orderCode` devuelve los productos del pedido elegido.
- El telefono carga cinco pedidos inicialmente y otros cinco al solicitar `Cargar 5 pedidos mas`.
- El detalle incluye producto, cantidad, precio unitario pagado, descuento y total de linea.
- El resumen informa ultima visita, ultima compra, ultimo total, cantidad de pedidos y productos frecuentes.
- Los pedidos cancelados, anulados o rechazados no se toman como ultima compra ni alimentan productos frecuentes.
- La auditoria de consulta devuelve una respuesta compacta y no reenvia el estado completo.

## Rendimiento

La prueba automatizada con doce pedidos obtuvo:

- pagina de cinco pedidos: 1229 bytes;
- detalle de un pedido: 462 bytes;
- respuesta de auditoria: 389 bytes.

El endpoint agrega `Server-Timing` y `X-DL-Client-History-Ms` para medir la consulta.

## Validacion

Ejecutar:

```powershell
npm.cmd run test:client-history
```

La prueba verifica paginacion, resumen, detalle progresivo y respuesta compacta de auditoria.
