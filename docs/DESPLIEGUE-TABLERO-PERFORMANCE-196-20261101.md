# Release 8790-196 - Agregacion del Tablero

## Cambio

El Tablero ahora obtiene los resumenes de cuenta mediante `AccountEngine.accountSummaries`, que indexa pedidos y movimientos una vez por cliente. Se conservan las reglas y el resultado; no se escriben datos durante el calculo.

## Pruebas locales

- Copia aislada: 104.213.176 bytes; 1.645 clientes, 2.031 pedidos y 1.783 movimientos.
- Construccion completa del Tablero: 9.280 ms antes y 46 ms despues (202,8x).
- JSON del Tablero identico antes y despues.
- `node --check app.js` y `node --check scripts/smoke-inventory-finance-workspaces.js`.
- `node scripts/smoke-inventory-finance-workspaces.js`: OK; resumenes identicos y estado del fixture sin cambios.
- No se modificaron archivos de datos.

## Produccion

Desplegado como `8790-196`, commit `7f4bcd23715d8ebac21cfad46693614f611dbbf7`.

- Backup previo: `/opt/distribuidora-lopez/backups/emergency-20261102-010546`.
- Servicio reiniciado y activo; health local/publico `ok: true`, version/runtime `8790-196`.
- Licencia valida e integridad `29/29`, sin archivos cambiados ni faltantes.
- SHA-256 publico de `app.js`: `362f9a3d4ac3e949994f36fddd2102f8ffac2596fac69f99a5fe47222fd7d7c9`, igual al checkout.
- `demo-state.json` y `users.json` identicos al backup.
- Comparacion de pedidos del 01/11/2026: cero faltantes, agregados o modificados.
- El reinicio cerro las 2 sesiones que estaban abiertas; deben volver a ingresar.
- Validacion visual autenticada del Tablero pendiente; no se usaron credenciales.
