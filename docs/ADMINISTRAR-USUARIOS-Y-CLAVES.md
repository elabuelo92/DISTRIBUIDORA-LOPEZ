# Administrar usuarios y claves

Fecha: 2026-08-10

## Importante

`data\users.json` es el archivo de usuarios, pero las claves estan protegidas con `salt` y `passwordHash`. No se debe escribir una clave visible dentro de ese archivo ni modificar esos dos campos manualmente.

## Metodo recomendado en produccion

Ingresar como administrador y abrir:

```text
https://lopez.gruporochaapp.com/index.html#usuarios
```

Desde esa pantalla se puede:

- Crear usuarios.
- Modificar nombre visible.
- Cambiar rol.
- Asociar vendedor.
- Asignar lista de precios predeterminada.
- Bloquear el cambio de lista de precios.
- Activar o desactivar usuarios.
- Cambiar clave.

Cada guardado solicita nuevamente la clave del administrador conectado, genera backup automatico de `data/users.json` y registra auditoria.

## Cambiar usuarios en el paquete origen

Ejecutar:

```text
C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\ADMINISTRAR-USUARIOS.cmd
```

La herramienta permite:

- Cambiar el nombre de ingreso.
- Cambiar el nombre visible.
- Elegir rol `admin`, `seller`, `driver`, `receiver` o `depot`.
- Asociar una cuenta `seller` con el vendedor correspondiente.
- Cambiar la clave individual.
- Crear usuarios nuevos.

Si se deja la nueva clave vacia para un usuario existente, se conserva su clave actual. Cada cambio genera automaticamente una copia `users.json.backup-FECHA`.

## Cambiar usuarios del servidor instalado

Para modificar directamente el servidor activo en `C:\DLPreventaServer`, abrir PowerShell como administrador y ejecutar:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
powershell.exe -ExecutionPolicy Bypass -File .\scripts\manage-users.ps1 -UsersFile "C:\DLPreventaServer\data\users.json"
```

Luego cerrar las sesiones abiertas. Para invalidar todas las sesiones inmediatamente, reiniciar el servidor.

## Reglas recomendadas

- No compartir cuentas entre personas.
- Usar una clave distinta por usuario.
- Mantener al menos dos administradores activos.
- No borrar usuarios con operaciones historicas; desactivarlos para conservar trazabilidad.
- No enviar claves por grupos de WhatsApp.
