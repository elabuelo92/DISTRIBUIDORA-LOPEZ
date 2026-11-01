# Release 8790-194 - secuencia de herramientas de Reparto

Fecha: 2026-11-01

## Alcance

- Reordena las herramientas para seguir el flujo: planificacion, hojas de ruta, entrega/cobro, cierres, correcciones, ordenes de cobro, GPS, auditoria y configuracion.
- El mismo orden se usa en el tablero y en el selector de herramientas.
- La numeracion es continua para cada perfil visible.
- No cambia permisos, datos, rutas, pedidos, cobros ni reglas de negocio.

## Pruebas previas

- `node --check app.js`: aprobado.
- `node scripts/smoke-delivery-workspace-order.js`: aprobado para Administracion y Reparto.
- `node scripts/smoke-published-route-driver-v168.js`: aprobado.
- `node scripts/smoke-delivery-gps-correction-ui.js`: aprobado.
- `scripts/smoke-delivery-driver-ux.js` conserva una asercion antigua que busca un marcador no presente en el codigo actual; no corresponde al orden de herramientas.

## Despliegue

El resultado, commit, respaldo y verificaciones finales quedan registrados en el recibo del despliegue.
