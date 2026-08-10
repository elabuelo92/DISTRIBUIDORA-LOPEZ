# V81 - GPS en segundo plano, Preventa y aprobacion comercial

Fecha: 2026-08-05
Version: 8790-81

## Alcance aplicado

- APK Android recompilada con servicio foreground de ubicacion.
- Permisos Android revisados: ubicacion precisa, ubicacion en segundo plano, notificaciones y exclusion de optimizacion de bateria.
- Envio de GPS independiente de pedidos, ventas o entregas.
- Payload GPS ampliado con bateria, estado online/offline, precision, dispositivo y version de app.
- Servidor preparado para guardar bateria y estado online en presencia/historial GPS.
- Preventa movil permite observaciones del pedido.
- Preventa movil permite solicitar descuento por producto, descuento general o modificacion de precio con motivo obligatorio.
- Los pedidos con solicitud comercial quedan en estado "Pendiente de aprobacion comercial".
- Administracion puede aprobar o rechazar la solicitud desde la grilla de Pedidos.
- Al aprobar, se recalculan importes, descuentos, comisiones y trazabilidad.
- Al rechazar, se conserva el precio original y el pedido vuelve al flujo operativo correspondiente.
- Alta de cliente movil exige dia de visita y ruta, ademas de los datos obligatorios ya definidos.
- Mis Ventas muestra comision por pedido y exporta ese dato.
- Edicion administrativa de pedidos muestra precio unitario, descuento, subtotal y total antes de guardar.
- Redisenio de precios por lista en productos: costo, porcentaje sobre costo y precio por lista.

## Guia operativa Android

1. Instalar la APK v81.
2. Iniciar sesion con usuario vendedor o repartidor.
3. Aceptar ubicacion precisa.
4. En Android 10 o superior, aceptar ubicacion en segundo plano cuando el sistema lo solicite.
5. Permitir notificaciones, porque Android exige notificacion persistente para rastreo activo.
6. Desde la pantalla Estado tocar "Configurar bateria" si el celular corta el GPS al minimizar.
7. En ajustes del telefono dejar la app sin optimizacion de bateria.

## Validaciones ejecutadas

- `node --check app.js`
- `node --check order-engine.js`
- `node --check server.js`
- Prueba Node directa: pedido con solicitud comercial, aprobacion administrativa, recalculo de importe y auditoria.
- Compilacion APK: `DL-Preventa-8790-v81-GPS-FONDO.apk`

## Observaciones

- El seguimiento en segundo plano depende de permisos reales del telefono y de que Android no mate el servicio por ahorro de bateria.
- Algunas marcas pueden requerir excluir manualmente la app de ahorro de energia.
- Si el usuario cierra sesion, el servicio GPS se detiene.
- Si el usuario fuerza cierre de la app desde Android, el sistema operativo puede detener cualquier servicio.

## Archivos principales modificados

- `app.js`
- `order-engine.js`
- `server.js`
- `index.html`
- `styles.css`
- `config.js`
- `sw.js`
- `android-apk-src/AndroidManifest.xml`
- `android-apk-src/src/com/distribuidora/lopez/MainActivity.java`
- `android-apk-src/src/com/distribuidora/lopez/LocationForegroundService.java`

