# Correccion de bloqueo de autenticacion v105

Fecha: 20/08/2026

## Hallazgos

- La IP publica no cambio: `lopez.gruporochaapp.com` resuelve a `216.128.169.34`.
- Caddy permanecia activo, pero Node podia quedar sin responder y producir `502 Bad Gateway`.
- La verificacion de clave utilizaba PBKDF2 sincrono dentro del hilo principal.
- El cierre de sesion todavia reescribia el estado operativo completo, de aproximadamente 107 MB.

## Correcciones

- PBKDF2 se ejecuta de forma asincrona para no bloquear el resto de la API.
- El cierre de sesion utiliza exclusivamente `session-audit.log` y no reescribe `demo-state.json`.
- Los ingresos superiores a un segundo registran `LOGIN_PERF` con tiempos por etapa en el journal del servicio.
- Se mantiene la misma cantidad de iteraciones PBKDF2 y no se reduce la seguridad de las claves.

## Complemento v106

Un login sin coordenadas todavia se interpretaba como GPS rechazado y disparaba una escritura completa del estado. Desde v106 la ausencia de GPS permite iniciar sesion con ubicacion pendiente. Las coordenadas efectivamente recibidas que sean simuladas, antiguas o invalidas continuan siendo rechazadas y auditadas.

## Validacion requerida

- Sintaxis Node y smoke funcional.
- Backup de datos antes del despliegue.
- Integridad y licencia correctas.
- Login y logout publicos.
- `/api/health` disponible mientras se procesan varios intentos de autenticacion.
