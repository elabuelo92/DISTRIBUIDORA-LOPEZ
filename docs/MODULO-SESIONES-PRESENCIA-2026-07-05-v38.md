# Modulo Sesiones Activas y Presencia - v38

Fecha: 2026-07-05
Version: v38 - SESIONES Y PRESENCIA

## Objetivo

Garantizar una unica sesion activa por usuario, presencia en tiempo real, GPS unico por usuario y monitor administrativo para control de dispositivos.

## Alcance implementado

- Politica configurable de sesiones duplicadas:
  - `replace`: cerrar sesion anterior y permitir nuevo ingreso.
  - `reject`: rechazar nuevo ingreso si el usuario ya esta conectado.
- Registro de dispositivo al iniciar sesion:
  - ID.
  - Etiqueta.
  - Modelo.
  - Sistema operativo.
  - Version de aplicacion.
  - IP.
  - GPS inicial si existe.
- Presencia en tiempo real:
  - Heartbeat cada 10 segundos.
  - Estado Disponible / En Reparto / Sin conexion.
  - Ultima sincronizacion.
  - Ultima ubicacion GPS.
- GPS sin duplicados:
  - La interfaz deduplica por usuario.
  - Siempre se muestra una unica posicion por vendedor.
  - Se conserva la ultima ubicacion si el equipo queda sin conexion.
- Panel de Administracion:
  - Sesiones activas.
  - Dispositivo.
  - Estado.
  - IP.
  - GPS.
  - Hora de inicio.
  - Ultima actividad.
  - Tiempo conectado.
  - Cierre forzado de sesiones.
  - Configuracion de politica de duplicados.

## Endpoints usados

- `POST /api/login`
- `POST /api/logout`
- `GET /api/session`
- `GET /api/admin/sessions`
- `GET /api/admin/session-settings`
- `POST /api/admin/session-settings`
- `POST /api/admin/sessions/:sessionId/close`
- `POST /api/presence/heartbeat`
- `POST /api/presence/location`

## Auditoria

Se registra:

- Inicio de sesion.
- Cierre de sesion.
- Cierre forzado por administrador.
- Intento de multiples sesiones rechazado.
- Cambio de politica de duplicados.
- Actualizaciones GPS en `session-audit.log`.

## Archivos modificados

- `server.js`
- `index.html`
- `app.js`
- `styles.css`

## Validacion funcional

1. Ingresar con un usuario vendedor en un dispositivo.
2. Ingresar con el mismo usuario en otro dispositivo.
3. Con politica `replace`, debe cerrar la sesion anterior.
4. Con politica `reject`, debe rechazar el segundo ingreso.
5. Desde Administracion abrir `Admin > Sesiones activas`.
6. Verificar que el vendedor figure una sola vez.
7. Forzar cierre y verificar que desaparezca del mapa/monitor.
