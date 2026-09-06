# Checklist manual - Version 8790-135

Fecha: 06/09/2026
Alcance: Prompts 132, 133, 134, 135, 136 y 137

## 0. Version y acceso

- [ ] Abrir el sistema y verificar en el tablero `Version instalada: 8790-135`.
- [ ] Confirmar que la fecha/hora de actualizacion corresponde al 06/09/2026.
- [ ] Cerrar y volver a abrir la aplicacion sin usar `Ctrl+F5`; debe continuar mostrando 8790-135.
- [ ] Ingresar como Administracion y recorrer Clientes, Pedidos, Armado, Reparto, Cuentas, Precios, Comisiones y Proveedores.
- [ ] Confirmar que no aparecen errores `signal is aborted`, mensajes JavaScript ni tablas vacias inesperadas.

## 1. Prompt 135 - Descuentos ligados al producto

- [ ] Crear o elegir un pedido con dos productos, preferentemente con nombres similares.
- [ ] Solicitar un descuento para una sola linea de producto.
- [ ] Aprobar el descuento desde Administracion.
- [ ] Confirmar que cambia solamente el producto solicitado.
- [ ] Confirmar que cantidad, precio y descuento de las otras lineas permanecen iguales.
- [ ] Reordenar o editar el pedido y comprobar que el descuento sigue ligado al mismo producto.
- [ ] Confirmar que el total del pedido coincide con la suma final de sus lineas.
- [ ] Intentar retirar el producto con descuento pendiente; el sistema debe impedir perder esa solicitud.
- [ ] Revisar la auditoria: debe mostrar producto, valor anterior, valor nuevo, usuario, fecha y motivo.

## 2. Prompt 134 - Comisiones y cuenta del vendedor

- [ ] Abrir Comisiones y seleccionar un vendedor real desde el selector.
- [ ] Crear o modificar una regla y confirmar que queda asociada al vendedor y a su usuario correcto.
- [ ] Verificar que una regla especifica tenga prioridad sobre la regla general.
- [ ] Generar el detalle de un periodo con una venta de varios productos.
- [ ] Confirmar que el informe muestra cantidades reales vendidas, importe, porcentaje y comision.
- [ ] Exportar PDF y verificar que el total se vea completo y alineado.
- [ ] Exportar Excel y comparar sus valores contra el PDF y la pantalla.
- [ ] Abrir la cuenta del vendedor y comprobar `Devengado`, `Pagado` y `Saldo`.
- [ ] Registrar un pago parcial y confirmar que el saldo disminuye solo por ese importe.
- [ ] Confirmar que el pago conserva medio, referencia, usuario y pedidos alcanzados.
- [ ] Intentar pagar mas que el saldo; el sistema debe rechazarlo.
- [ ] Confirmar que un pago parcial no marca como liquidados todos los pedidos del periodo.

## 3. Prompt 136 - Preventa sin stock

- [ ] Ingresar como preventista y buscar un producto con stock disponible igual a cero.
- [ ] Confirmar que permanece visible con advertencia `SIN STOCK`.
- [ ] Agregar una cantidad al pedido y enviarlo normalmente.
- [ ] Confirmar que el pedido se crea una sola vez y aparece en Administracion.
- [ ] Verificar que la cantidad sin disponibilidad queda informada como faltante.
- [ ] Confirmar que el stock fisico no queda negativo ni se inventa mercaderia.
- [ ] Abrir el pedido en Armado y comprobar que el faltante sigue visible.

## 4. Prompt 132 - Reparto operativo

- [ ] Ingresar como `dario` y confirmar acceso a Reparto y Planificacion rapida.
- [ ] Confirmar que Dario no puede abrir Usuarios, Precios, Proveedores, Stock ni configuraciones generales.
- [ ] Abrir una jornada con 50 a 60 pedidos y verificar la lista compacta.
- [ ] Confirmar que etiqueta y cantidad de bultos siguen siendo obligatorias antes del despacho.
- [ ] Pasar un pedido a `Listo para Despacho` sin escanear; debe permitirse.
- [ ] Usar el scanner en otro pedido y confirmar que la evidencia sigue registrandose.
- [ ] Seleccionar pedidos por lote y asignarlos a una ruta.
- [ ] Reordenar con arrastre y soltar.
- [ ] Reordenar tambien con `Subir` y `Bajar`.
- [ ] Salir y volver a entrar; el orden debe persistir.
- [ ] Publicar la ruta y confirmar la secuencia numerica.
- [ ] Registrar una entrega o rechazo sin firma; debe permitirse.
- [ ] Registrar otra operacion con firma y confirmar que queda como evidencia opcional.

## 5. Prompt 133 - Cuentas consolidadas

- [ ] En Clientes, hacer doble clic sobre un cliente; debe abrir su estado de cuenta.
- [ ] Repetir usando el boton `Cuenta`; debe abrir la misma ficha.
- [ ] En Proveedores, hacer doble clic sobre un proveedor y repetir con el boton `Cuenta`.
- [ ] Confirmar que la ficha muestra identificacion, estado, saldo, totales, movimientos e historial.
- [ ] Confirmar que cada movimiento muestra fecha, tipo, medio, referencia, debe, haber, saldo, estado y usuario.
- [ ] Usar `Editar datos` y comprobar que abre la entidad correcta.
- [ ] Usar `Imprimir estado` y revisar encabezado, saldo y movimientos.
- [ ] En un cliente con deuda, registrar un pago parcial en efectivo.
- [ ] Confirmar que se muestran saldo anterior y saldo nuevo correctos.
- [ ] Registrar otro pago por transferencia con numero de operacion.
- [ ] Confirmar que el movimiento conserva exactamente `Transferencia`, sin cambiarlo por otro medio.
- [ ] Intentar una transferencia sin referencia; debe rechazarse.
- [ ] Intentar un pago mayor al saldo; debe rechazarse.
- [ ] Abrir un proveedor y registrar pago; debe exigir respaldo documental y quedar pendiente de conciliacion.
- [ ] En Reparto, elegir `Transferencia Pendiente`; debe conservar esa opcion cuando queda saldo pendiente.
- [ ] Informar efectivo y transferencia reales; solo en ese caso debe quedar `Mixto`.

## 6. Prompt 137 - Carteras completas en PDF

- [ ] Ir a Clientes y pulsar `PDF cartera completa`.
- [ ] Confirmar que el archivo incluye todos los clientes, no solo los visibles en pantalla.
- [ ] Verificar codigo, nombre, CUIT, telefono, domicilio, localidad, zona, ruta y vendedor.
- [ ] Verificar dias y horario de visita, estado, forma de pago, saldo y GPS.
- [ ] Confirmar que el PDF informa fecha, hora, version y cantidad total de clientes.
- [ ] Ir a Precios y pulsar `PDF productos y precios`.
- [ ] Confirmar que incluye todos los productos activos e inactivos.
- [ ] Verificar codigo, EAN, descripcion, rubro, marca, proveedor, estado, costo, stock y unidad.
- [ ] Verificar precios vigentes de Lista 1, 2, 3, 4 y 5.
- [ ] Comparar tres productos del PDF contra la pantalla de Precios.
- [ ] Confirmar que el PDF informa fecha, hora, version y cantidad total de productos.

## 7. Regresion general

- [ ] Crear un pedido normal y confirmar que no se duplica ante reintentos.
- [ ] Editar un pedido existente y comprobar que conserva cliente, lineas y totales.
- [ ] Imprimir pedido, factura y etiqueta.
- [ ] Abrir Proveedores, Clientes y Precios y comprobar que los buscadores siguen funcionando.
- [ ] Verificar que los pedidos listos siguen apareciendo en Planificacion rapida.
- [ ] Confirmar que no cambiaron estados, importes, bultos ni rutas de pedidos anteriores por instalar la version.
- [ ] Revisar el monitor: servicio activo, memoria normal y sin reinicios repetidos.

## Registro de prueba

| Modulo | Usuario | Fecha/hora | Resultado | Observacion |
|---|---|---|---|---|
| Descuentos | | | Pendiente | |
| Comisiones | | | Pendiente | |
| Preventa sin stock | | | Pendiente | |
| Reparto | | | Pendiente | |
| Cuentas | | | Pendiente | |
| PDF clientes | | | Pendiente | |
| PDF productos | | | Pendiente | |
| Regresion general | | | Pendiente | |
