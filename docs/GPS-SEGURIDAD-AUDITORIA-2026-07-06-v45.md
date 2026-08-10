# Distribuidora Lopez - v45 GPS, Seguridad y Auditoria

Fecha: 2026-07-06

## Objetivo

Cerrar Prompt 19 y Prompt 20:

- tomar ubicacion exclusivamente desde el dispositivo movil;
- no aceptar ubicacion del servidor ni geolocalizacion por IP;
- rechazar ubicaciones simuladas/mock;
- registrar precision GPS;
- mostrar alertas en Administracion;
- evitar duplicados por usuario;
- permitir auditoria de ubicaciones rechazadas.

Tambien se agregaron correcciones pedidas:

- clave de administrador obligatoria para editar clientes;
- filtros adicionales en Stock;
- impresion/exportacion de auditorias;
- usuarios nuevos con sesion GPS aparecen en mapa aunque no existieran previamente en `state.sellers`.

## Cambios aplicados

### GPS real

- La APK v45 envia:
  - latitud;
  - longitud;
  - precision;
  - proveedor Android;
  - fecha/hora del dispositivo;
  - indicador `mock`;
  - estado de proveedores GPS/red.
- La web conserva compatibilidad con GPS por navegador cuando se usa HTTPS o localhost.
- El login intenta capturar GPS real antes de enviar credenciales.
- Si el GPS no llega al login, la app entra y continua solicitando GPS obligatorio.

### Bloqueo de ubicacion simulada

- El servidor rechaza:
  - `mock=true`;
  - fuentes `demo`, `simulada`, `mock`, `fake`, `server`, `servidor`, `ip`, `geoip`;
  - coordenadas fuera de rango.
- Las coordenadas rechazadas no actualizan vendedor ni repartidor.
- Se guardan en `state.rejectedGps`.
- Se genera auditoria global `GPS_RECHAZADO`.
- Se genera notificacion critica para administradores.

### Precision GPS

- Si la precision supera 100 metros:
  - se acepta como ubicacion real;
  - se muestra advertencia de baja precision;
  - se notifica a Administracion.

### Administracion

- Monitor de sesiones muestra:
  - usuario;
  - dispositivo;
  - estado;
  - IP;
  - GPS;
  - precision;
  - ultima actividad.
- Nuevo panel: `GPS rechazado`.
- El mapa alternativo ya no dibuja posiciones de relleno para usuarios sin GPS.
- Usuarios nuevos conectados con GPS se agregan dinamicamente al mapa/listado de vendedores.

### Clientes

- Editar cliente ahora requiere:
  - usuario administrador;
  - motivo del cambio;
  - reingreso de clave de administrador.
- El servidor valida la clave aunque alguien intente llamar la API directamente.

### Stock

- Se agregaron filtros:
  - busqueda libre;
  - estado;
  - rubro;
  - marca.
- Exportar/Imprimir respeta los filtros aplicados.

### Auditoria

- Se agrego boton `Imprimir auditoria`.
- Genera PDF local con el filtro actual de auditoria.

## APK

APK nueva:

- `android-apk/out/DL-Preventa-GPS-V45-8790.apk`
- `android-apk/out/DL-Preventa.apk`
- `android-apk/out/DL-Preventa-GPS-NATIVO-8790.apk`

Importante:

- Para detectar mock location en Android hay que instalar APK v45.
- El navegador web puede detectar fuentes prohibidas si se informan, pero la deteccion Android real de mock provider sale de la APK.

## Pruebas realizadas

- `node --check SERVIDOR_UNICO_8790/app.js`: OK.
- `node --check SERVIDOR_UNICO_8790/server.js`: OK.
- Build APK v45: OK.
- `apksigner verify`: OK con esquemas v1, v2 y v3.
- Smoke funcional:
  - servidor temporal en puerto `8898`;
  - login admin OK;
  - envio de GPS mock;
  - respuesta HTTP `422`;
  - registro en `state.rejectedGps`;
  - auditoria `GPS_RECHAZADO`.

## Notas

- La ubicacion real se guarda en sesiones activas, no en `state.sellers` persistente, para evitar que una ubicacion vieja parezca actual.
- El mapa de Administracion se alimenta de presencia en tiempo real.
- Si un telefono pierde conexion, el usuario queda sin conexion segun la politica de sesiones y no se inventa una posicion nueva.

