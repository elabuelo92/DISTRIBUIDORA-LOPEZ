# APK GPS nativo Android - 2026-06-16

## Objetivo

Crear una APK nueva para que la preventa movil use GPS nativo del telefono y no dependa de la geolocalizacion del navegador Chrome.

## Motivo

Chrome Android bloquea GPS cuando la pagina se abre por HTTP remoto:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

La APK usa WebView para cargar la misma pantalla, pero agrega un puente nativo:

```text
window.AndroidLocation.start(...)
window.receiveNativeLocation(...)
window.receiveNativeLocationError(...)
```

De esa manera Android pide permisos de ubicacion y entrega latitud/longitud reales al sistema.

## URL embebida

Primaria:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

Fallback:

```text
http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html#preventa
```

## Permisos Android

- Internet.
- Estado de red.
- Ubicacion precisa.
- Ubicacion aproximada.

## Identificador Android

```text
com.distribuidora.lopez.gps
```

Se usa un identificador separado de la APK vieja `com.distribuidora.lopez` para poder instalar y probar `DL Preventa GPS` sin desinstalar la version anterior ni chocar con firmas distintas.

## Requisitos de uso

1. El servidor debe estar corriendo en la PC:

```text
http://127.0.0.1:8790/api/health
```

2. El telefono debe estar conectado a Tailscale.
3. Android debe tener Ubicacion activada.
4. La app `DL Preventa GPS` debe tener permiso de ubicacion.

## Fuente Android

```text
C:\DistribuidoraLopez\android-apk-src
```

## Compilacion

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\DistribuidoraLopez\android-apk-src\build-apk.ps1
```

## APK generada

```text
C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\android-apk\out\DL-Preventa-GPS-NATIVO-8790.apk
```

## Actualizacion 2026-06-17

Se recompilo la APK para corregir solape con barras superiores/inferiores de Android mediante WindowInsets y acompanar el frontend `8790-12`.

Actualizacion adicional:

- WebView sin cache para evitar login viejo.
- URL primaria/fallback con `v=8790-12`.
- Fallback por nombre Tailscale completo, no IP directa.

SHA256:

```text
08C91A46436ECB1A8C81DAE0093456A3983C8AD99A2C85995071E6D66BFD345B
```

## Diagnostico si no toma GPS

- Verificar permiso de ubicacion de la app en Android.
- Verificar que Ubicacion este activa en Android.
- Usar ubicacion precisa, no solo aproximada.
- Probar al aire libre si Android no entrega lectura en interior.
- Confirmar que la app muestra `GPS real nativo` en el panel de preventa.
