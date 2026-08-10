# Modulo Dashboard Operativo - v37

Fecha: 2026-07-05
Version: v37 - DASHBOARD OPERATIVO

## Objetivo

Crear un tablero operativo en tiempo real para administracion, con estados de pedidos, caja del dia, deuda, transferencias pendientes y alertas criticas sin recargar la pagina.

## Alcance implementado

- Conteo de pedidos por estado operativo:
  - Pendientes.
  - En Preparacion.
  - Armados.
  - En Reparto.
  - Entregados.
  - Cobrados.
  - Cerrados.
- Total vendido del dia.
- Total cobrado del dia.
- Total pendiente.
- Transferencias pendientes de validar.
- Clientes con deuda.
- Clientes fuera del limite de credito.
- Pedidos demorados.
- Alertas operativas limitadas a las primeras 4 por maxima urgencia.
- Actualizacion automatica aprovechando la sincronizacion existente cada 2,5 segundos.
- Cada tarjeta de estado mantiene el PDF de corte por estado.

## Fuente de datos

- `state.orders`: pedidos, importes, estados, demoras y fechas.
- `state.accounts`: cobros registrados.
- `state.bankReconciliation`: transferencias pendientes de conciliacion.
- `state.clients`: saldos, deuda y limites de credito.
- `orderDelayInfo`: reglas de demora por estado.

## Criterio de "hoy"

El corte diario se calcula con zona horaria `America/Argentina/Buenos_Aires`.

Para pedidos se usa:

- `createdAt`
- `receivedAt`
- `dateIso`
- `updatedAt`

Para cobros se usa:

- `at`
- `createdAt`
- `dateIso`
- `date`

## Archivos modificados

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `scripts/smoke-v37.ps1`

## Validacion

Ejecutar:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v37.ps1
```

Resultado esperado:

```text
Resultado: smoke v37 OK.
```
