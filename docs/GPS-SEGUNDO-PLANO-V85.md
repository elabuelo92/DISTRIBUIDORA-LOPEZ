# GPS en segundo plano - APK v85

Fecha: 2026-08-06

## Objetivo

Mantener el GPS de vendedores y repartidores actualizado en el tablero aun cuando la aplicacion quede minimizada, con una tasa de envio aproximada de 10 segundos mientras exista una sesion activa.

## APK

Archivo principal:

`android-apk/out/DL-Preventa-8790-v85-GPS-FONDO-10SEG.apk`

Copias compatibles:

- `android-apk/out/DL-Preventa.apk`
- `android-apk/out/DL-Preventa-GPS-NATIVO-8790.apk`
- `android-apk/out/DL-Preventa-GPS-NATIVO-8790-v85.apk`

Version Android:

- `versionCode`: 40
- `versionName`: 4.0-gps-fondo-v85

## Cambios aplicados

- El servicio nativo de GPS queda activo como foreground service con notificacion persistente.
- El servicio no se apaga si Android destruye la pantalla/WebView en segundo plano.
- La URL, cookie de sesion, dispositivo y version quedan guardados para reinicio automatico del servicio.
- El GPS envia posicion cada 10 segundos cuando hay ubicacion disponible.
- Si todavia no hay posicion, envia heartbeat para mantener la sesion viva.
- El servicio se detiene al cerrar sesion desde la aplicacion.
- La WebView refresca el servicio nativo al minimizar o salir de la pantalla.

## Configuracion obligatoria en cada celular

1. Instalar la APK v85.
2. Abrir la aplicacion e iniciar sesion.
3. Permitir ubicacion precisa.
4. Permitir ubicacion siempre o en segundo plano si Android lo solicita.
5. Permitir notificaciones.
6. En Ajustes > Aplicaciones > DL Preventa > Bateria, seleccionar sin restricciones o no optimizar.
7. En Samsung/Xiaomi/Realme/Huawei/OPPO/VIVO/HONOR revisar que la app no quede en suspension profunda.

## Prueba de campo

1. Iniciar sesion con vendedor o repartidor.
2. Verificar en Administracion que aparezca en el mapa.
3. Minimizar la aplicacion durante 3 minutos.
4. Confirmar que la hora de ultima actualizacion no supere 20 o 30 segundos.
5. Apagar la pantalla durante 3 minutos.
6. Confirmar que el punto sigue actualizando.
7. Cerrar sesion y verificar que el equipo deje de figurar como conectado.

## Nota operativa

Si el telefono cierra el GPS despues de varios minutos, revisar primero optimizacion de bateria. Algunos fabricantes bloquean servicios en segundo plano aunque la app este correctamente desarrollada.
