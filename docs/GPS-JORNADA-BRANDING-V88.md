# GPS de jornada, recorridos y branding - v88

## Objetivo

Mantener las sesiones laborales abiertas durante toda la jornada operativa y generar un control diario de recorrido para vendedores y repartidores.

## Cambios incluidos

- Version del servidor actualizada a `8790-88`.
- Sesion laboral configurada por defecto en 20 horas.
- Jornada operativa configurada de 7:00 a 22:00.
- Historial GPS ampliado para conservar jornadas completas de varios dispositivos.
- Nuevo endpoint administrativo:
  - `GET /api/admin/presence/daily-routes`
  - `GET /api/admin/presence/daily-routes?format=csv`
- Nuevo panel en Dashboard:
  - `Recorridos de jornada`
  - filtros por fecha, rol y horario
  - descarga CSV
  - hoja PDF de recorrido
  - apertura directa en Google Maps
- Branding sutil de Grupo Rocha Solutions en login e inicio.

## Activacion

El puerto `8790` puede quedar tomado por un proceso Node anterior. Para activar esta version:

1. Ejecutar como administrador:

   `C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\REINICIAR-SERVIDOR-8790-V88-ADMIN.cmd`

2. Validar:

   `http://127.0.0.1:8790/api/health`

3. Confirmar que el health muestre:

   - `version: 8790-88`
   - `runtimeVersion: 8790-88`
   - `INTEGRITY_OK`
   - `LICENSE_OK`

## Uso administrativo

1. Ingresar como administrador.
2. Abrir `Tablero general`.
3. Ir a `Recorridos de jornada`.
4. Seleccionar fecha.
5. Revisar vendedores y repartidores.
6. Usar:
   - `Actualizar recorrido`
   - `Exportar CSV`
   - `Imprimir hoja`
   - `Abrir recorrido en Maps`

## Nota tecnica importante sobre GPS en segundo plano

El servidor queda preparado para recibir GPS cada 10 segundos y no cerrar sesiones durante la jornada.

Para garantizar GPS con pantalla apagada o app minimizada en Android, la APK debe tener un `Foreground Service` nativo con permisos:

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE_LOCATION`
- `POST_NOTIFICATIONS`

En esta carpeta solo estan los APK compilados; no esta el proyecto Android fuente. Para corregir definitivamente la APK hay que recompilar desde el codigo fuente Android real.
