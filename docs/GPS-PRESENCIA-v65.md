# GPS, presencia y cierre de sesion - v65

Fecha: 2026-07-23

## Objetivo

Corregir el seguimiento GPS de preventistas y repartidores para que Administracion vea solamente usuarios realmente conectados, sin duplicados y sin depender de pedidos, entregas o sincronizaciones comerciales.

## Cambios aplicados

- Version del servidor, cache web y APK actualizada a `8790-65`.
- Nuevo servicio de presencia independiente:
  - `POST /api/presence/heartbeat`
  - `POST /api/presence/location`
  - `GET /api/presence/status`
  - `GET /api/admin/presence/history`
- Heartbeat configurable desde Administracion.
- GPS periodico independiente de ventas, reparto y cambios de estado.
- Logout con cierre inmediato:
  - invalida token
  - detiene heartbeat
  - detiene GPS nativo Android
  - quita el usuario del mapa operativo
- Una unica sesion activa por usuario con politica configurable:
  - reemplazar sesion anterior
  - rechazar inicio duplicado
- Rechazo de GPS no confiable:
  - ubicacion simulada
  - baja precision
  - coordenada antigua
  - fecha del dispositivo futura
- Historial GPS por jornada en `data/gps-history.log`.
- Monitor de sesiones con ultimas desconexiones.
- Mapa de Administracion con filtros:
  - Todos
  - Vendedores
  - Repartidores
  - Alertas GPS

## Regla operativa

El mapa operativo muestra presencia activa. El historial GPS queda guardado aparte y no debe confundirse con un usuario conectado.

Si un telefono cierra sesion o deja de enviar heartbeat, el usuario sale del mapa activo. La ultima ubicacion se conserva solo para auditoria/historial.

## Pruebas realizadas

- `node --check server.js`
- `node --check app.js`
- `node --check sw.js`
- `node --check config.js`
- `node --check order-engine.js`
- `node --check delivery-engine.js`
- `node --check account-engine.js`
- `node --check license-engine.js`
- `node --check scripts/license-admin.js`
- Licencia: `LICENSE_OK`
- Integridad: `INTEGRITY_OK`
- Servidor temporal en puerto `8895`:
  - health con `runtimeVersion = 8790-65`
  - login vendedor correcto
  - envio de GPS correcto
  - coordenada antigua rechazada con `GPS_REJECTED`
  - monitor admin muestra un solo vendedor activo
  - logout vendedor elimina inmediatamente el marcador activo
- APK compilada y verificada con `apksigner`:
  - `DL-Preventa-GPS-NATIVO-8790-v65.apk`
  - SHA256 `C9ABA62DA62EC5600EB4CE1DFB41FE538B407B2958D475D226CF3B13FE197CFD`

## Archivo APK

Instalar en los telefonos Android:

`android-apk/out/DL-Preventa-GPS-NATIVO-8790-v65.apk`

Tambien se actualizo el APK generico:

`android-apk/out/DL-Preventa-GPS-NATIVO-8790.apk`

Ambos tienen el mismo hash SHA256.

## Verificacion en campo

1. Instalar la APK v65.
2. Iniciar sesion con un vendedor o repartidor.
3. Aceptar permiso de ubicacion precisa.
4. Abrir Administracion en la PC.
5. Ir a Tablero / mapa de presencia.
6. Confirmar que aparece un solo marcador por usuario.
7. Mover el telefono sin cargar pedidos.
8. Confirmar que la ubicacion se actualiza.
9. Cerrar sesion desde el telefono.
10. Confirmar que desaparece inmediatamente del mapa activo.

## Si no aparece GPS

Revisar en el telefono:

- Ubicacion activada.
- Permiso de ubicacion precisa para la app.
- Tailscale conectado si accede por red externa.
- Ahorro de bateria desactivado para la app durante pruebas.
- No usar ubicacion simulada/mock location.

