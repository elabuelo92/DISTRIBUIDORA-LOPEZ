# V48 - Reparto, cobranza mixta visible, adjuntos y GPS continuo

Fecha: 2026-07-07

## Motivo

Se detecto que en la app de Reparto la cobranza mixta no era suficientemente visible y que el selector de comprobantes podia fallar en Android. Tambien se reforzo el GPS de vendedores y repartidores para mantener actualizaciones al volver de segundo plano.

## Cambios en Reparto

- El modal `Cobrar y entregar` ahora muestra explicitamente `Cobranza mixta`.
- Se agregaron accesos rapidos:
  - Todo efectivo
  - Todo transferencia
  - Todo cuenta corriente
  - Pago mixto manual
- Se mantienen campos discriminados:
  - efectivo
  - transferencia
  - cuenta corriente / saldo pendiente
- La validacion sigue siendo:
  - efectivo + transferencia + cuenta corriente = total cobrable

## Comprobantes

- Se separaron los adjuntos de transferencia en tres controles:
  - Sacar foto
  - Adjuntar imagen
  - Adjuntar PDF / archivo
- Si hay monto por transferencia, el comprobante sigue siendo obligatorio.
- Se agrega texto de estado indicando que comprobante quedo seleccionado.

## APK Android

- Se agrego permiso de camara en el manifest.
- Se mantiene `onShowFileChooser` para Android WebView.
- Version Android: `2.3-gps-v48`.

## GPS vendedor/repartidor

- La app web ahora solicita GPS al:
  - entrar a Preventa
  - entrar a Reparto
  - volver de segundo plano
  - recuperar foco
  - recuperar conexion
- Reparto ahora tiene timer de GPS propio.
- La APK agrega `AndroidLocation.startContinuous(...)` para mantener actualizaciones nativas cada pocos segundos mientras la app siga viva.

## Limite tecnico

Android puede restringir procesos cuando la aplicacion queda mucho tiempo en segundo plano. Para trazabilidad real aunque el repartidor minimice durante largos periodos, la siguiente mejora recomendada es implementar un `Foreground Service` con notificacion persistente de ubicacion. V48 mejora el comportamiento actual sin redisenar la APK como servicio permanente.

## Pruebas realizadas

- `node --check SERVIDOR_UNICO_8790/app.js`: OK.
- `node --check SERVIDOR_UNICO_8790/server.js`: OK.
- Validacion de IDs HTML/JS: OK, solo `resetDemoBtn` opcional.
- Smoke motor de reparto con pago mixto: OK.
- Smoke servidor temporal v48: OK.
- APK v48 compilada y verificada con `apksigner`: OK.

## Archivos

- APK: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa-GPS-NATIVO-8790-v48.apk`
- APK alias: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa.apk`

