# Regularizacion de comisiones de Analgesicos

## Alcance

- Periodo: 01/11/2026 a 04/11/2026, inclusive, hora Argentina.
- Vendedores: Axel, Kevin Guibert, Matias y Ruggero.
- Regla: 10% para Analgesicos; las reglas de cigarrillos y resto no se cambian.
- Pedidos anteriores al 01/11 quedan fuera.
- Pedidos liquidados, con pagos o asociados a una liquidacion quedan protegidos.
- Se recalcula solo la comision del vendedor; la comision de reparto se conserva.
- No se alteran pedidos, importes de venta, stock, reservas, cuentas corrientes ni liquidaciones.

## Circuito

Comisiones incluye una vista previa no persistente, confirmacion administrativa, ejecucion con identificador unico y auditoria por pedido mas una marca de operacion. Si cambia el estado entre vista previa y confirmacion, se cancela y pide repetir la vista previa. Los reintentos devuelven el informe ya guardado y no duplican el recalc.

El informe muestra por vendedor y producto: pedidos, lineas, unidades, base neta, porcentaje y comision devengada. Distingue los importes protegidos que no se recalculan. El CSV es descargable desde el modulo.

## Pruebas locales

- `node scripts/smoke-commission-analgesic-recalc-199.js`: aprobado.
- `node scripts/smoke-commission-analgesic-recalc-http-199.js`: aprobado con estado sintetico temporal; permisos, vista previa sin escritura, ejecucion, auditoria e idempotencia.
- `node scripts/smoke-p4-commissions.js`: aprobado.
- `npm run test:commission-governance`: aprobado.
- `node scripts/smoke-sales-policy-v111.js`: aprobado con copia local de datos como entrada de lectura y estado de prueba temporal.
- `npm run test:commission-account`: aprobado; HTTP solo en servidor temporal.

## Produccion

Version objetivo: `8790-199`.

Estado: preparado para despliegue. El despliegue requiere respaldo fresco, reinicio controlado y validacion de salud e integridad antes de ejecutar la regularizacion. La operacion requiere volver a iniciar sesion como administrador despues del reinicio.

Resultado de la regularizacion: pendiente de ejecucion en produccion tras el despliegue. El informe definitivo se conserva en la auditoria y se descarga desde Comisiones.
