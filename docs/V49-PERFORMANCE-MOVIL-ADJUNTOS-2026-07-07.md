# V49 - Performance movil, adjuntos y camara

Fecha: 2026-07-07

## Objetivo

Corregir lentitud en las pantallas moviles de Preventa y Reparto, y reemplazar los adjuntos que no respondian en celular por botones visibles de camara, galeria y archivo.

## Cambios aplicados

- Roles moviles `seller` y `driver` ya no ejecutan `renderAll()` en cada sincronizacion.
- Preventa movil solo redibuja controles de Preventa, carrito, resumen, GPS y asistente.
- Reparto movil solo redibuja rutas, paradas, cobranza y evidencias.
- El planificador administrativo de reparto se saltea para usuario repartidor.
- La sincronizacion movil baja a `mobileSyncInterval: 7000` ms desde `config.js`.
- GPS nativo continuo deja de reiniciarse cada 8 segundos desde JavaScript.
- Cada lectura GPS del vendedor ya no empuja todo el estado del ERP; se informa por presencia/GPS.
- Adjuntos de reparto ahora tienen botones visibles:
  - `CAM Sacar foto`
  - `IMG Galeria`
  - `PDF Archivo`
- Foto de entrega e incidencia tambien tienen boton `CAM`.
- Remitos de proveedor usan el mismo patron de botones moviles.
- APK v49 habilita `allowFileAccess`, `allowContentAccess` y permisos de imagen/camara.

## Archivos principales

- `app.js`
- `index.html`
- `styles.css`
- `config.js`
- `server.js`
- `sw.js`
- `android-apk-src/AndroidManifest.xml`
- `android-apk-src/src/com/distribuidora/lopez/MainActivity.java`

## Prueba en telefono

1. Instalar `DL-Preventa-GPS-NATIVO-8790-v49.apk`.
2. Verificar que el servidor responda por Tailscale:
   - `http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html#preventa`
3. Abrir Reparto con usuario `reparto1`.
4. Entrar a una parada y tocar `CONTROLADO` / cobrar.
5. En transferencia, cargar importe mayor a cero.
6. Verificar que aparecen:
   - `CAM Sacar foto`
   - `IMG Galeria`
   - `PDF Archivo`
7. Tocar `CAM Sacar foto` y confirmar que Android abre camara.
8. Tocar `IMG Galeria` y confirmar que abre galeria.
9. Tocar `PDF Archivo` y confirmar que abre selector.
10. Confirmar que la app responde mas fluida al desplazarse y cargar cantidades.

## Enlace operativo

- PC servidor: `http://localhost:8790/index.html#dashboard`
- Dispositivos por Tailscale: `http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html#preventa`
- API health: `http://desktop-c2c0q4v.tail6f19de.ts.net:8790/api/health`

No usar la IP cruda `100.116.67.7:8790` para pruebas de navegador, porque Tailscale Serve publica por MagicDNS/host y puede devolver 404 si se entra por IP.

## Nota sobre GPS en segundo plano

V49 reduce reinicios de GPS y usa el modo continuo nativo cuando esta disponible. Si Android corta la ubicacion al minimizar la app durante mucho tiempo, la solucion definitiva es implementar un `Foreground Service` nativo con notificacion persistente. Eso debe quedar como siguiente ajuste Android si la prueba real de ruta confirma cortes en segundo plano.

## Paquete generado

- ZIP: `release/DLPreventaServer-UNICO-8790-2026-07-07-v49-PERFORMANCE-MOVIL-ADJUNTOS.zip`
- APK: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa-GPS-NATIVO-8790-v49.apk`

## Pruebas realizadas

- `node --check app.js`
- `node --check server.js`
- chequeo de IDs HTML usados por JavaScript
- smoke del servidor temporal
- smoke de la carpeta release
- APK compilada, alineada, firmada y verificada con `apksigner`
