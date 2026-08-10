# Armado, Etiquetas y Despacho - v42

Fecha: 2026-07-05

## Objetivo

Integrar deposito, etiquetado y despacho para impedir que un pedido salga a reparto sin control de armado.

## Flujo implementado

1. Pendiente
   - El pedido queda esperando stock si hay faltantes.

2. En Preparacion
   - El stock esta completo y reservado.

3. En Armado
   - Deposito prepara la mercaderia.
   - Desde Pedidos se habilita el boton Etiqueta.

4. Etiquetado
   - El operario confirma cantidad de bultos.
   - Puede indicar impresora o etiqueta usada.
   - Puede agregar observaciones.
   - El sistema genera etiqueta con codigo de barras Code 39.

5. Listo para Despacho
   - Se llega solo al escanear la etiqueta.
   - El codigo escaneado debe coincidir con el pedido.
   - El pedido queda disponible para planificar hoja de ruta.

6. Despachado
   - Solo se alcanza al publicar una hoja de ruta.
   - El servidor valida que el pedido tenga:
     - etiqueta generada,
     - etiqueta escaneada,
     - bultos confirmados.

## Etiqueta

La etiqueta incluye:

- numero de pedido,
- cliente,
- direccion,
- zona/ruta,
- cantidad de bultos,
- observaciones,
- codigo de barras Code 39 del pedido.

El codigo impreso es el numero de pedido, por ejemplo `PED-2076`, para que una pistola laser pueda ingresarlo como teclado.

## Bloqueos de seguridad

- Ya no se permite pasar de En Armado a Despachado con el boton Avanzar.
- La hoja de ruta solo acepta pedidos en Listo para Despacho.
- Si se edita un pedido etiquetado, la etiqueta queda invalidada y el pedido vuelve a En Armado.
- Reimprimir una etiqueta de un pedido listo fuerza nuevo escaneo.

## Auditoria

Se registran eventos en auditoria global, trazabilidad del pedido y bus de eventos:

- `PEDIDO_ETIQUETA_GENERADA`
- `PEDIDO_ETIQUETA_ESCANEADA`
- `PEDIDO_ETIQUETA_INVALIDADA`
- `RUTA_PUBLICADA_DESPACHO`
- `PEDIDO_DESPACHADO`

## Uso operativo

1. Administracion o deposito entra a Pedidos.
2. Avanza el pedido hasta En Armado.
3. Toca Etiqueta.
4. Confirma bultos y genera/imprime.
5. Toca Escanear.
6. Dispara la pistola laser sobre la etiqueta.
7. El pedido queda Listo para Despacho.
8. Reparto planifica ruta con pedidos listos.
9. Al publicar la ruta, el pedido pasa a Despachado.

## Pendiente futuro

- Configuracion centralizada de impresora por deposito.
- Impresion directa silenciosa desde servicio Windows.
- Soporte para etiquetadoras Zebra/Brother con comandos ZPL/ESC/P.
