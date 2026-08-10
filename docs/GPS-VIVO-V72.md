# GPS vivo v72 - vendedores y repartidores

Fecha: 2026-07-30
Version: 8790-72

## Objetivo

Mostrar en el Tablero general la ubicacion real y actualizada de vendedores y repartidores conectados desde la APK.

El mapa usa solamente GPS del dispositivo. No usa ubicacion del servidor ni ubicacion por IP.

## Instalacion en telefonos

1. Copiar e instalar:
   `android-apk/out/DL-Preventa-GPS-NATIVO-8790-v72.apk`
2. Abrir la APK.
3. Iniciar sesion con usuario vendedor o repartidor.
4. Aceptar permisos de ubicacion.
5. En Android, configurar:
   - Ubicacion precisa: activada.
   - Permiso de ubicacion: permitir mientras se usa la app. Si Android ofrece "Permitir todo el tiempo", elegirlo para mejor rastreo en segundo plano.
   - Bateria: sin restricciones para DL Preventa.
   - Tailscale: conectado.

## Funcionamiento

Cuando un vendedor o repartidor inicia sesion:

- La APK obtiene GPS nativo.
- Envia ubicacion al servidor.
- Inicia un servicio Android de primer plano con notificacion "DL Preventa GPS activo".
- Mientras la sesion siga activa, la ubicacion se actualiza aun con la app en segundo plano.
- Al cerrar sesion se detiene el rastreo.

## Verificacion desde Administracion

1. Abrir:
   `http://127.0.0.1:8790/index.html#dashboard`
2. Ingresar como administrador.
3. Revisar el panel:
   `Mapa general en vivo`
4. Deben aparecer:
   - Vendedores conectados.
   - Repartidores conectados.
   - Estado.
   - Precision GPS.
   - Hora de ultima actualizacion.
   - Equipo/dispositivo.

## URL para dispositivos por Tailscale

Usar MagicDNS:

`http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html#dashboard`

Health:

`http://desktop-c2c0q4v.tail6f19de.ts.net:8790/api/health`

## Diagnostico rapido

Si el usuario no aparece en el mapa:

1. Verificar que el telefono tenga Tailscale conectado.
2. Verificar permiso de ubicacion precisa.
3. Verificar que no este activado ahorro de bateria para DL Preventa.
4. Verificar que la APK instalada sea v72.
5. Entrar en Administracion > Admin > Sesiones activas y revisar si el usuario tiene sesion vigente.
6. Probar desde el telefono:
   `http://desktop-c2c0q4v.tail6f19de.ts.net:8790/api/health`

## Nota operativa

Android puede pausar procesos en segundo plano si la bateria esta en modo restringido. Para seguimiento continuo en ruta, dejar DL Preventa sin restricciones de bateria y mantener Tailscale conectado.
