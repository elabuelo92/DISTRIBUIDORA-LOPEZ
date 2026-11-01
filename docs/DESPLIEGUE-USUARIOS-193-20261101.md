# Release 8790-193 - administracion de usuarios

Fecha: 2026-11-01

## Alcance

- Permite dar de baja y reactivar vendedores, repartidores y otros usuarios administrados.
- La baja desactiva el acceso, cierra las sesiones del usuario y conserva su cuenta e historial comercial.
- La operacion requiere motivo y reautenticacion administrativa; el servidor conserva respaldo y auditoria.
- No se agrega borrado permanente desde la pantalla de usuarios.
- La cuenta administrativa conectada no se puede desactivar a si misma.

## Verificacion previa

- `node --check app.js`: aprobado.
- `node --check server.js`: aprobado.
- `node scripts/smoke-managed-user-status.js`: aprobado en fixture aislada.
- La prueba verifica baja/reactivacion, motivo, clave administrativa, respaldo, cierre/bloqueo de sesion, proteccion contra autobaja e integridad de pedidos, cartera, comisiones, liquidaciones y movimientos de stock.
- No se modificaron usuarios ni datos de negocio en produccion durante la preparacion.

## Despliegue

Registrar aqui el commit publicado, la ubicacion del respaldo y el resultado de salud/version despues del reinicio controlado.
