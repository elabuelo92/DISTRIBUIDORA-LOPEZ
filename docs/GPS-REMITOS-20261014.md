# GPS Reparto y adjuntos de remitos

Implementado localmente. Despliegue autorizado con respaldo y reinicio controlado; validacion productiva se registra por separado.

## GPS

MainActivity.java envia deviceAt como milisegundos numericos. captureDeliveryClientGps usaba Date.parse y descartaba esas capturas. Ahora admite numero e ISO, comprueba frescura y envia ISO al endpoint existente. Progreso y error vinculados al cliente seleccionado, una sola captura simultanea. No se cambia la autorizacion ni se aprueban coordenadas automaticamente.

## Remitos

Camara acumula fotos; galeria/archivos permiten multiples adjuntos. Listado con nombres y quitar antes de guardar. Maximo 10 archivos, 9 MB originales en pantalla y 12 MB codificados en API; limites individuales existentes conservados. Validacion de todos los archivos antes de guardarlos, deduplicacion de contenido, metadata uploads y upload legado. Acceso por endpoint autorizado existente.

Cada remito distinto mantiene numero, fecha, productos y carga separados; no se mezclan varios documentos economicos en un solo remito. Crear remito no impacta stock/deuda: sigue pendiente de conciliacion. No se modifican registros historicos ni comisiones.

## Pruebas

- smoke-delivery-gps-correction-ui: varios clientes, doble clic, reintento, errores, Android numerico/ISO, timers liberados.
- smoke-client-gps-review-v135: permisos, aprobacion y propagacion GPS; remitos con varios adjuntos, descarga, duplicado concurrente, numeros distintos, limite, adjunto legado; stock y deuda sin cambio al cargar.

Pendiente aceptacion de GPS real en telefono y visualizacion del formulario autenticado. No se debe afirmar que la simulacion valida los permisos o senal GPS de todos los dispositivos.
