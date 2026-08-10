# Plan de 30 dias ajustado al relevamiento

Objetivo: implementar una primera version operativa, usable y estable para Distribuidora Lopez, priorizando preventa, stock, pedidos, cobranzas, logistica y dashboard.

## Semana 1 - Base productiva y modelo real

Resultado esperado:

- Sistema corriendo en entorno controlado.
- Roles y usuarios base.
- Datos reales modelados.
- APK de preventa lista para pruebas.
- Acceso remoto definido.

Tareas:

- Instalar base del servidor Windows.
- Definir acceso remoto HTTPS para vendedores en calle.
- Crear roles: direccion, compras_stock, ventas_internas, preventista, reparto, catalogo.
- Ajustar clientes con CUIT, razon social, condicion fiscal, direccion, telefono, tipo y forma de pago.
- Ajustar productos con costo, precio, stock minimo, categoria y rotacion.
- Agregar proveedores con condiciones comerciales.
- Preparar importacion inicial desde Excel.
- Mantener backup diario.

Criterio de aceptacion:

- Administracion ingresa al dashboard.
- Preventista ingresa desde celular.
- Pedido de prueba llega a administracion.
- Stock se valida antes de enviar pedido.
- Backup queda generado.

## Semana 2 - Preventa, pedidos, clientes y stock

Resultado esperado:

- Preventa usable por vendedores.
- Clientes y productos cargados desde planillas.
- Stock con entradas/salidas y control semanal.

Tareas:

- Importar clientes.
- Importar productos y stock inicial.
- Alta de cliente nuevo desde preventa con estado pendiente de aprobacion.
- Pedido desde celular con validacion de stock.
- Pedido recibido por ventas internas/deposito.
- Hoja de armado para deposito.
- Descuento con marca de autorizacion.
- Stock: ingreso por compra, egreso por pedido y ajuste por inventario.
- Cierre semanal de stock de los lunes.

Criterio de aceptacion:

- Kevin/preventista puede cargar pedido real.
- Eric ve pedido y lo manda a armado.
- Cecilia puede cargar ingreso de mercaderia.
- Stock critico aparece en dashboard.
- Diferencia de inventario queda registrada.

## Semana 3 - Cobranzas, reparto, proveedores y cuentas

Resultado esperado:

- Operacion de reparto y cobranza controlada.
- Cuentas corrientes y proveedores centralizados.

Tareas:

- Crear rutas por zona y dia.
- Crear vehiculos y repartidores.
- Asignar pedidos a reparto.
- Registrar entrega, devolucion y pendiente.
- Registrar cobranza por efectivo, transferencia, Mercado Pago o cuenta corriente.
- Registrar pago con mercaderia para mayoristas.
- Rendicion de reparto por Eduardo/Manuel.
- Proveedores con saldo, vencimientos y condiciones.
- Orden de compra con autorizacion de Martin.

Criterio de aceptacion:

- Dashboard muestra pedidos pendientes, entregados y cobrados.
- Repartidor registra cobranza/rendicion.
- Cuenta corriente del cliente se actualiza.
- Proveedores tienen saldo y vencimiento.
- GPS de vendedores/repartidores aparece en mapa.

## Semana 4 - Reportes, estabilizacion e instalacion final

Resultado esperado:

- Version estable para salida operativa.
- Indicadores gerenciales disponibles.
- Usuarios capacitados.

Tareas:

- Dashboard gerencial: facturacion, margen, caja, stock critico, cobranzas, productividad y rentabilidad.
- Reportes: ventas por vendedor, zona, cliente, producto y periodo.
- Clientes activos/inactivos.
- Ticket promedio y frecuencia de compra.
- Rotacion, quiebres, cobertura e inmovilizados.
- Pruebas con datos reales.
- Capacitacion por rol.
- Instalacion final en servidor con UPS.
- Plan de soporte y mejoras.

Criterio de aceptacion:

- Martin puede ver indicadores centrales.
- Administracion trabaja sin Excel para procesos principales.
- Vendedores operan desde APK.
- Deposito arma pedidos desde el sistema.
- Backup y recuperacion quedan probados.

## Fuera del primer mes salvo urgencia

- Facturacion fiscal completa si requiere integracion especifica.
- Integracion bancaria automatica.
- Catalogo digital avanzado.
- App nativa con servicio GPS en segundo plano permanente.
- BI avanzado o tableros externos.
