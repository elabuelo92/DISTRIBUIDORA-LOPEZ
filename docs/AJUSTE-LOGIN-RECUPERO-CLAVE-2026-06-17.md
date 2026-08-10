# Ajuste login y recupero de clave - 2026-06-17

## Estado de fase

Se mantiene la fase:

```text
Fase de modificacion / estabilizacion movil y acceso
```

No se avanza a la fase siguiente hasta validar login, sincronizacion y GPS en telefono real.

## Problema detectado

En APK y navegador el sistema mostraba:

```text
No se pudo conectar con el servidor.
```

El ingreso podia funcionar despues de varios intentos o refrescos.

## Causas encontradas

- El servidor activo escuchaba como `127.0.0.1`, suficiente para la PC pero fragil para celular.
- El service worker podia mostrar una pantalla vieja aunque la API no estuviera disponible.
- La APK usaba cache normal de WebView.
- La URL directa por IP `http://100.116.67.7:8790` responde `404 page not found` por Tailscale Serve, porque esa capa espera el host `desktop-c2c0q4v` o `desktop-c2c0q4v.tail6f19de.ts.net`.

## Cambios aplicados

- Servidor cambiado a `0.0.0.0:8790`.
- Script de arranque `scripts/run-server-prod.ps1` actualizado a `DL_HOST=0.0.0.0`.
- Frontend subido a version `8790-12`.
- Login ahora verifica `/api/health` antes de enviar credenciales.
- Login reintenta conexion antes de mostrar error final.
- Mensaje de error ahora indica probar `/api/health`.
- Service worker `v12` deja de servir login viejo si el servidor no responde.
- APK recompilada con WebView sin cache.
- APK usa fallback `desktop-c2c0q4v.tail6f19de.ts.net:8790`, no IP directa.
- Agregado recupero de clave desde la pantalla de ingreso.
- El recupero registra solicitudes en:

```text
C:\DLPreventaServer\data\password-recovery.log
```

## URLs validadas

Funcionan:

```text
http://desktop-c2c0q4v:8790/api/health
http://desktop-c2c0q4v.tail6f19de.ts.net:8790/api/health
```

No usar como URL principal:

```text
http://100.116.67.7:8790/api/health
```

Esa IP puede devolver 404 por la configuracion de Tailscale Serve.

## APK vigente

```text
C:\DistribuidoraLopez\release\DL-Preventa-GPS-NATIVO-8790.apk
```

SHA256:

```text
08C91A46436ECB1A8C81DAE0093456A3983C8AD99A2C85995071E6D66BFD345B
```

## Pruebas realizadas

- `/api/health` local OK.
- `/api/health` por `desktop-c2c0q4v` OK.
- `/api/health` por `desktop-c2c0q4v.tail6f19de.ts.net` OK.
- Login `carlos / Lopez2026!` OK.
- Login con clave incorrecta devuelve 401.
- Recupero de clave registra solicitud en log.

## Pendiente

- Probar APK instalada en telefono real.
- Configurar numero real en `window.DL_SUPPORT_WHATSAPP_PHONE`.
- Definir proceso administrativo real para restablecer claves desde panel de usuarios.
