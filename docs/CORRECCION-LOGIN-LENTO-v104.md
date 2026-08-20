# Correccion de ingreso lento v104

Fecha: 20/08/2026

## Incidente

El servicio respondia, pero algunos dispositivos informaban falta de conexion o demoraban varios segundos al iniciar sesion.

## Causa comprobada

Cada inicio fallido, rechazo por sesion duplicada e inicio correcto agregaba una auditoria al estado operativo y reescribia de forma sincrona `demo-state.json`. En produccion ese archivo tenia aproximadamente 96 MB, por lo que una sola autenticacion podia bloquear temporalmente el proceso Node y afectar a los demas usuarios.

La politica de sesiones estaba configurada como `replace`; no se encontraron rechazos por sesion duplicada en los ultimos 500 eventos revisados.

## Correccion

- Los eventos de autenticacion se registran en `session-audit.log`.
- El login deja de reescribir el estado comercial completo.
- Se conserva la auditoria de inicio, cierre, credencial invalida y sesion duplicada.
- No se modifican usuarios, claves, roles, sesiones ni datos comerciales.

## Validacion local

- `node --check server.js`: correcto.
- `node --check app.js`: correcto.
- Smoke funcional v103 sobre la base temporal: correcto.
- Diez credenciales invalidas: 15 a 23 ms despues del primer calentamiento.
- Credencial valida: 687 ms sobre el entorno temporal.

## Validacion requerida en produccion

1. Crear respaldo de `/opt/distribuidora-lopez/data`.
2. Actualizar desde `main`.
3. Regenerar el manifiesto de integridad para `8790-104`.
4. Reiniciar `distribuidora-lopez.service`.
5. Verificar salud, login real, licencia, integridad y latencia de autenticacion.
