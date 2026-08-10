# Ajuste GPS y cierre de ventanas - 2026-06-16

## Servidor corregido

- Carpeta operativa: `C:\DLPreventaServer`
- Puerto unico: `8790`
- URL local: `http://127.0.0.1:8790/index.html#preventa`
- Version frontend: `8790-5`

## Cambios aplicados

1. Se desactivo Google Maps por defecto.
   - El sistema deja de depender de API key, facturacion o restricciones de Google.
   - La pantalla de preventa usa el mapa interno del sistema para mostrar los vendedores con GPS.
   - Si en el futuro se quiere reactivar Google Maps, hay que configurar `config.js` con `USE_GOOGLE_MAPS: true` y una API key valida.

2. Se corrigio el cierre de ventanas modales.
   - Los botones `X` y `Cancelar` ya no ejecutan `submit`.
   - Ahora cierran la ventana aunque falten campos obligatorios.
   - Escape sigue funcionando igual.

3. Se actualizo la cache del navegador.
   - `index.html`, `app.js`, `config.js`, `styles.css` y `manifest.json` apuntan a version `8790-5`.
   - `sw.js` usa cache `distribuidora-lopez-servidor-unico-8790-v5`.

## Prueba sugerida

1. En la PC abrir:
   `http://127.0.0.1:8790/index.html#preventa`
2. Presionar `Ctrl + F5`.
3. Entrar como administrador.
4. Ir a `Clientes`, tocar `Nuevo cliente` y cerrar con `X`.
5. Repetir en `Stock`, `Ingreso stock` y `Nuevo producto`.
6. Ir a `Preventa` y verificar que el mapa ya no muestre el error de Google Maps.

## Nota GPS movil

El navegador del celular puede bloquear GPS real si la app se abre por `http://` desde una red externa. Para GPS real en calle se recomienda usar la APK, porque tiene puente nativo de ubicacion. El mapa interno muestra la ubicacion registrada por el sistema y evita que falle la pantalla por Google Maps.
