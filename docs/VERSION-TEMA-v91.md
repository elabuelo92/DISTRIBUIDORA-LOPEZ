# Version visible y modo oscuro - v91

Fecha local: 2026-08-13 21:10 ART

## Objetivo

Evitar dudas sobre si un equipo esta viendo una version vieja del sistema y permitir activar una pantalla en modo oscuro.

## Cambios aplicados

- Version del sistema actualizada a `8790-91`.
- Se agrego un indicador visible en la barra superior con:
  - version instalada en el navegador;
  - fecha y hora de actualizacion;
  - estado de verificacion contra `/api/health`.
- Se agrego una franja en el tablero principal con:
  - version del navegador;
  - version del servidor;
  - boton `Verificar ahora`.
- Si el navegador y el servidor no coinciden, el sistema muestra advertencia para refrescar con `Ctrl+F5` o limpiar cache.
- Se agrego boton `Modo oscuro` / `Modo claro`.
- La preferencia visual queda guardada en el navegador con la clave `dlThemeMode`.

## Uso operativo

1. Entrar al tablero principal.
2. Revisar el chip superior `Version instalada`.
3. Presionar `Verificar ahora` en el tablero.
4. Si dice que navegador y servidor no coinciden, forzar recarga con `Ctrl+F5`.
5. Para cambiar el tema, presionar `Modo oscuro`. El mismo boton vuelve a `Modo claro`.

## Archivos modificados

- `index.html`
- `config.js`
- `app.js`
- `styles.css`
- `server.js`
- `sw.js`

## Validacion

- `node --check` sobre archivos JavaScript principales.
- Arranque local temporal en puerto `8791`.
- `/api/health` respondio `version=8790-91`, `runtimeVersion=8790-91`, `LICENSE_OK`, `INTEGRITY_OK`.
