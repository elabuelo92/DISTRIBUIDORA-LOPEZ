# Congelamiento operativo para inventario físico

La modalidad temporal `allowSuperadmin` mantiene el servidor en mantenimiento y deja pasar exclusivamente a una sesión con rol `admin` y nombre de usuario exacto `superadmin`.

- Los usuarios y sesiones ordinarias no pueden abrir la aplicación operativa ni consultar o modificar APIs mientras el corte está activo.
- El inicio de sesión queda habilitado únicamente para la cuenta `superadmin`; una cuenta administrativa con otro nombre recibe mantenimiento.
- El acceso a salud del servicio y al logo permanece público, igual que en el modo de mantenimiento anterior.
- La pausa no desactiva ni elimina usuarios y no modifica pedidos, inventario, reservas, pagos o saldos.
- Al reiniciar el proceso, las sesiones activas se pierden y los usuarios deben volver a ingresar cuando se retire el modo de mantenimiento.
- La reapertura se realiza retirando `data/maintenance-mode.json` por el procedimiento operativo autorizado; no editar `users.json` para reabrir.

La publicación de emergencia crea respaldo de `app` y `data`, activa el modo antes de detener el servicio, verifica integridad de los datos y deja el archivo de mantenimiento activo solo si las verificaciones de salud pasan. Si la publicación falla, el procedimiento de rollback restaura el servicio anterior y retira el modo de mantenimiento.

Pruebas aisladas: administrador regular bloqueado en página y APIs, login regular rechazado, sesión y login superadmin permitidos, y login ordinario recuperado al retirar el modo.
