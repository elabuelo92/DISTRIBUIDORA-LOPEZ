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

Despliegue autorizado. Pendiente registrar commit, backup, reinicio controlado y verificaciones finales.
