# Prompt 4 - Flujo de Estados

Fecha: 2026-06-30  
Version: v29 FLUJO ESTADOS  
Servidor: puerto 8790

## Objetivo

Unificar el ciclo de vida del pedido con los estados definidos por el cliente:

```text
Pendiente
↓
En Preparación
↓
Armado
↓
Despachado
↓
En Reparto
↓
Entregado
↓
Cobrado
↓
Cerrado
```

## Cambios implementados

- Se reemplazo el vocabulario operativo anterior por el flujo nuevo.
- Se mantiene compatibilidad con estados historicos:
  - `Preventa` se normaliza como `Pendiente`.
  - `Pendiente de abastecimiento` se normaliza como `Pendiente`.
  - `Completo para armado` se normaliza como `En Preparación`.
  - `Bajar` y `Controlado` se normalizan como `En Reparto`.
- El modulo de reparto ahora opera:
  - `Despachado` → `En Reparto` → `Entregado/Cobrado`.
- Si la entrega queda totalmente paga, el pedido termina en `Cobrado`.
- Si queda saldo pendiente, el pedido queda `Entregado` con cobranza pendiente.
- Si la entrega fue parcial, se conserva el estado `Parcialmente Entregado` para no perder la regla del Prompt 2.
- `Cobrado` puede avanzar a `Cerrado` desde administracion.

## Abastecimiento

El estado visible es `Pendiente`.

Cuando faltan productos:

- el pedido queda en `Pendiente`;
- los faltantes siguen apareciendo en el planificador de abastecimiento;
- al ingresar stock, el pedido pasa automaticamente a `En Preparación`.

## Trazabilidad

Cada cambio de estado agrega una entrada en `order.trace`.

Campos guardados:

- `status`
- `at`
- `date`
- `time`
- `actor`
- `user`
- `note`
- `gps`

El GPS se guarda cuando corresponde, principalmente en reparto:

- `En Reparto`
- `Entregado`
- `Cobrado`

## Botones ajustados

En reparto:

- `INICIAR REPARTO` cambia el pedido de `Despachado` a `En Reparto`.
- `COBRAR Y ENTREGAR` registra entrega, cobranza, GPS y evidencia.

En administracion:

- `Avanzar` permite:
  - `En Preparación` → `Armado`
  - `Cobrado` → `Cerrado`
- El despacho sigue saliendo desde el planificador de rutas.

## Validacion

Se agrega `scripts/smoke-v29.ps1`.

El smoke comprueba:

- servidor activo;
- index servido como v29;
- sintaxis JavaScript;
- pedido con faltante queda `Pendiente`;
- ingreso de stock lo pasa a `En Preparación`;
- avance a `Armado`;
- publicacion de ruta a `Despachado`;
- GPS de reparto a `En Reparto`;
- entrega con pago completo a `Cobrado`;
- cierre administrativo a `Cerrado`;
- trazas con fecha, hora, usuario y GPS.

