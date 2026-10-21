# P11 - Facturas y nombres de rutas

Version preparada: 8790-180.

## Cambios
- Factura: columna Descuento % entre precio unitario y subtotal. Informa el porcentaje efectivamente aplicado al importe persistido de la linea respecto a su precio base, incluyendo descuentos generales distribuidos.
- No se recalculan pedidos ni se cambia el precio unitario neto que ya mostraba la factura. Se aclara que el descuento informado ya esta incluido, sin aplicar una segunda rebaja.
- Descuentos solicitados pendientes no se presentan como aplicados. Si no existe base positiva/cantidad para calcular el porcentaje se informa 0%, sin inventar descuentos historicos.
- Planificacion: etiqueta Nombre de ruta. Se muestra el texto ingresado en el campo existente zone, sin anteponer el dia ni agregar el repartidor. Fecha, ID y responsable siguen disponibles como especificaciones.
- Sin renombrado masivo ni migracion de rutas. Respaldo para datos antiguos sin zone: name y luego id.

## Archivos funcionales
- app.js: factura, nombre en rendicion y selector de reubicacion.
- delivery-engine.js: presentacion de nombre de ruta.
- index.html: etiqueta y referencias de cache.
- config.js, server.js: version de publicacion.

## Pruebas
- 28 suites P1-P11: motores, HTTP aislado, descuentos aplicados/pendientes, precio neto sin cambios, 100 pedidos en planificacion/reordenamiento/publicacion.
- Prueba visual con la plantilla real y datos ficticios (P11-factura-demo.png).
- Version/cache y diff sin errores.
- Ninguna prueba funcional modifica pedidos ni rutas de produccion.

## Como probar
1. Abrir factura de pedido con descuento aprobado: revisar Descuento %, precio neto y subtotal; total igual al previo.
2. Revisar pedido con descuento pendiente: no debe mostrarse como aplicado.
3. En Planificacion, verificar Nombre de ruta y que el titulo muestre el nombre escrito sin prefijos automaticos.
4. Revisar una ruta existente: mismo ID, pedidos y responsable; cambia solo la presentacion del titulo.
