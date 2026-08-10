# Prompt 3 - Administracion: edicion pedido a pedido

Fecha: 2026-07-02  
Version: v31 - EDICION PEDIDOS  
Modulo: Pedidos y deposito

## Objetivo

Permitir que Administracion modifique pedidos desde la consola `Pedidos`, sin borrar informacion anterior y dejando auditoria completa.

## Implementado

- Boton visible `Editar pedido` en la columna `Accion`.
- Doble click sobre la fila del pedido para abrir la edicion.
- Edicion permitida para usuarios administradores.
- Estados editables:
  - `Pendiente`.
  - `En Preparacion`.
  - `Armado`.
- Estados no editables:
  - `Despachado`.
  - `En Reparto`.
  - `Parcialmente Entregado`.
  - `Entregado`.
  - `Cobrado`.
  - `Cerrado`.
  - `Cancelado`.

## Acciones disponibles

- Agregar productos.
- Quitar productos.
- Modificar cantidades.
- Cambiar observaciones.
- Registrar motivo obligatorio.

## Auditoria guardada

Cada modificacion guarda:

- Usuario.
- Username.
- Rol.
- Fecha.
- Hora.
- IP.
- Motivo.
- Estado anterior.
- Productos anteriores.
- Importe anterior.
- Observaciones anteriores.
- Estado posterior.
- Productos posteriores.
- Importe posterior.
- Observaciones posteriores.

La auditoria queda en:

- `order.editHistory`.
- `state.orderAudit`.
- Traza del pedido.
- Actividad operativa.

## Criterio tecnico

Los pedidos nuevos con `inventoryMode = reservation` recalculan reservas y faltantes.

Los pedidos historicos migrados con `inventoryMode = legacy-deducted` pueden editarse antes del despacho, pero no recalculan stock historico porque ese stock ya fue descontado por la logica previa. Si el pedido ya estaba posteado en cuenta, se ajusta el saldo por diferencia de importe.

## Prueba

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v31.ps1
```
