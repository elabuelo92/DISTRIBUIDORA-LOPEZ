# Distribuidora Lopez - v46 Estabilidad, LocalStorage, Reparto y Proveedores

Fecha: 2026-07-07

## Objetivo

Cerrar los prompts 21 a 30 con foco en estabilidad real de uso: evitar errores de almacenamiento local, limpiar pedidos moviles al confirmar, mejorar estadisticas de faltantes, gestionar incidencias de reparto y habilitar carga rapida de remitos de proveedor.

## Cambios principales

- LocalStorage:
  - Se elimina el uso pesado de `distribuidoraLopezDemo`.
  - El estado operativo queda en backend/base de datos.
  - LocalStorage queda limitado a metadatos livianos, dispositivo, impresora y preferencias minimas.
  - Se agrego control de tamano y limpieza automatica ante cuota llena.
  - Se agrego boton administrativo `Limpiar datos locales`.

- Preventa movil:
  - Al confirmar pedido correctamente se limpia carrito, producto, cantidad, busquedas, total y temporales.
  - Si falla el envio, el carrito se conserva para no perder la venta.

- Estadisticas:
  - Nueva seccion `Faltantes`.
  - Filtros por fecha, hora, producto, cliente, vendedor, zona y estado.
  - Exportacion CSV/PDF.

- Reparto:
  - Nuevos estados: `No entregado`, `Postergado`, `Rechazado`.
  - Motivo, observacion, fecha, hora, GPS y usuario obligatorios.
  - Rechazo exige firma digital del cliente.
  - Foto opcional de incidencia.
  - Notificacion a Administracion y auditoria.
  - Pedidos `No entregado` o `Postergado` vuelven a planificacion de ruta.

- Hoja de ruta:
  - Se mantiene orden automatico por cercania usando coordenadas del cliente y deposito.
  - Administracion puede ajustar manualmente antes de publicar.
  - Clientes sin destino valido quedan bloqueados en rojo.

- Proveedores:
  - Proveedor normalizado con CUIT, direccion, telefono, email, contacto, condicion de pago y observaciones.
  - Cuenta proveedor: total comprado, total pagado, saldo pendiente, vencidos y movimientos.
  - Carga rapida de remito con foto/PDF, productos recibidos y cantidades.
  - El remito impacta stock, cuenta proveedor, historial y administracion.

## Pruebas realizadas

- `node --check` OK:
  - `app.js`
  - `server.js`
  - `order-engine.js`
  - `delivery-engine.js`
- Smoke de servidor temporal en puerto 8896: `/api/health` OK.
- Prueba motor:
  - pedido con faltante
  - ingreso de stock
  - pedido pasa a `En Preparacion`
  - ruta publicada
  - incidencia `Postergado` registrada con GPS
- APK v46:
  - compilada
  - firmada
  - verificada con `apksigner` v1/v2/v3

## Archivos importantes

- Servidor: `SERVIDOR_UNICO_8790`
- APK: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa.apk`
- APK versionada: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa-GPS-NATIVO-8790-v46.apk`

## Instalacion

1. Cerrar servidores anteriores.
2. Abrir `INICIAR-SERVIDOR-V46.cmd`.
3. Probar en la PC:
   - `http://localhost:8790/api/health`
   - `http://localhost:8790/index.html#dashboard`
4. En celulares ya instalados:
   - cerrar y abrir la app.
   - si queda cache viejo, entrar como admin y usar `Limpiar datos locales`.
5. Para reinstalar APK:
   - usar `DL-Preventa.apk`.

## Nota operativa

Si aparece un error de cache viejo en el telefono, no reinstalar primero. Ejecutar:

- Administracion -> `Limpiar datos locales`
- volver a iniciar sesion

Solo reinstalar APK si el dispositivo no tiene la version v46 o si requiere la actualizacion del WebView nativo.
