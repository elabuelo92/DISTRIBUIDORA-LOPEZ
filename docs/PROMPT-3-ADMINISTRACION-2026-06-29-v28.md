# Prompt 3 - Administracion

Fecha: 2026-06-29  
Version: v28 ADMINISTRACION  
Servidor: puerto 8790

## Objetivo

Permitir que usuarios administradores modifiquen pedidos sin perder trazabilidad.

## Alcance implementado

- Edicion de pedidos desde el modulo Pedidos y deposito.
- Acciones permitidas:
  - agregar productos;
  - quitar productos;
  - modificar cantidades;
  - cambiar observaciones.
- Solicitud obligatoria de motivo antes de guardar.
- Endpoint protegido para administradores:
  - `POST /api/orders/{codigo}/edit`.
- Auditoria completa guardada dentro del pedido:
  - usuario visible;
  - nombre de usuario;
  - rol;
  - fecha y hora;
  - IP;
  - motivo;
  - estado anterior;
  - estado posterior.
- Trazabilidad visible en historial operativo del pedido.
- Recalculo automatico de:
  - productos del pedido;
  - importe;
  - reservas de stock;
  - faltantes;
  - estado del pedido.

## Reglas operativas

Solo se permite editar pedidos antes del despacho:

- Preventa.
- Pendiente de abastecimiento.
- Completo para armado.
- Armado.

Pedidos despachados, en reparto, entregados o cobrados no se editan desde este flujo. Esos casos deben resolverse luego con modulo de devolucion, ajuste auditado o nota de credito, para no romper trazabilidad.

## Regla de stock

Al editar un pedido:

1. El sistema libera las reservas anteriores del pedido.
2. Calcula nuevamente las cantidades pedidas.
3. Reserva stock disponible.
4. Si falta mercaderia, el pedido queda en `Pendiente de abastecimiento`.
5. Si hay stock suficiente, queda `Completo para armado` o conserva `Armado` si ya estaba en esa etapa.

## Auditoria

La informacion anterior nunca se elimina. Cada modificacion agrega una entrada en:

- `order.editHistory`
- `order.trace`
- `state.activity`

Esto permite reconstruir quien modifico el pedido, cuando, desde que IP, que motivo declaro y que cambio.

## Validacion

Se agrega `scripts/smoke-v28.ps1`.

El smoke comprueba:

- servidor activo;
- index servido como v28;
- sintaxis JavaScript;
- edicion de pedido en memoria;
- auditoria obligatoria;
- actualizacion de stock reservado;
- bloqueo de edicion en pedidos entregados.

