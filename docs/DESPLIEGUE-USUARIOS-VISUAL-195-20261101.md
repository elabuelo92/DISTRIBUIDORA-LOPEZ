# Release 8790-195 - Usuarios y profundidad visual ligera

Fecha: 2026-11-01

## Alcance

- Presenta el directorio de usuarios como vista principal, con filtros, estado del listado y acciones legibles a ancho completo.
- Muestra el formulario solo al crear o editar; permite cerrarlo y limpia las claves ingresadas al cerrar.
- Conserva endpoints, permisos, auditoria y reglas existentes de alta, edición, baja, reactivación y PIN.
- Reemplaza las siglas de navegación por los SVG Lucide ya incluidos en el proyecto.
- Agrega sombras pequeñas y elevación solo al hover/interacción en accesos y botones; respeta `prefers-reduced-motion` y no incorpora dependencias ni animaciones continuas.
- Actualiza referencias de versión y caché a `8790-195`.

## Seguridad y rendimiento

- No modifica datos, usuarios, pedidos, saldos, stock ni reservas.
- Los iconos son recursos SVG locales ya existentes; no se agregan paquetes.
- Los efectos visuales son CSS y no generan temporizadores, llamadas API ni trabajo periódico.

## Pruebas previas

- `node --check app.js`, `node --check server.js` y `node --check scripts/smoke-managed-user-status.js`.
- `node scripts/smoke-managed-user-status.js`: baja/reactivación, autorización, auditoría, cierre de sesión y conservación de datos en fixture aislada.
- Comprobación en navegador local del directorio a ancho completo y editor cerrado al ingreso.
- `git diff --check`.

## Despliegue

Desplegado y validado como `8790-195` desde el commit `0dd78c7fcf1492d238bf00ddbe6993436a269a49`.

- Respaldo completo: `/opt/distribuidora-lopez/backups/emergency-20261102-001247`.
- Servicio activo; mantenimiento desactivado; salud local y pública `ok: true`.
- Licencia válida e integridad `29/29`, sin archivos cambiados ni faltantes.
- SHA-256 de `demo-state.json` y `users.json` idénticos antes y después del despliegue.
- Comparación de pedidos del día: cero faltantes, agregados o modificados.
- Recursos publicados comparados contra el checkout en `VERIFICACION-PRODUCCION-195-20261102.json`.
- No se ejecutaron operaciones de negocio ni pruebas de escritura en producción.
