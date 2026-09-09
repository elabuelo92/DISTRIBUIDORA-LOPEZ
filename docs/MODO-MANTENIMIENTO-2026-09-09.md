# Modo de mantenimiento

Version: 8790-142

## Comportamiento

- El despliegue seguro activa la pantalla antes de detener el ERP.
- La pantalla permanece visible mientras se respalda, actualiza y valida el servicio.
- Se retira solo despues de recuperar `/api/health` y validar la integridad operativa.
- Si Node no responde, Caddy entrega la misma pantalla como respaldo.
- La pantalla reintenta abrir el sistema cada 20 segundos.

## Control manual

Desde la raiz del proyecto:

```powershell
python scripts/deploy/maintenance-window.py on
python scripts/deploy/maintenance-window.py status
python scripts/deploy/maintenance-window.py off
```

Mensaje operativo opcional:

```powershell
python scripts/deploy/maintenance-window.py on --message "Actualizacion programada"
```

El comando `off` se niega a ocultar la pantalla si el ERP no responde correctamente. La opcion `--force` queda reservada para soporte tecnico y una excepcion controlada.

## Primera instalacion del fallback

Ejecutar una vez despues de desplegar la version:

```powershell
python scripts/deploy/configure-caddy-maintenance.py
```

El script respalda `/etc/caddy/Caddyfile`, valida la configuracion antes de instalarla, recarga Caddy y comprueba la salud publica del ERP.
