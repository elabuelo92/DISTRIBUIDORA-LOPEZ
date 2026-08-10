# Relevamiento operativo - Distribuidora Lopez

Fecha de analisis: 2026-06-10

Este documento convierte el relevamiento inicial en especificacion funcional para adaptar el sistema a la operacion real de Distribuidora Lopez.

## Equipo y areas reales

Direccion general:

- Responsable: Martin Lopez.
- Funciones: estrategia, crecimiento comercial, decisiones financieras, compras, supervision operativa y coordinacion general.
- Permiso sugerido: direccion.

Compras y stock:

- Responsable: Cecilia.
- Funciones: inventario, pedidos a proveedores, recepcion de mercaderia, abastecimiento y control de precios.
- Permiso sugerido: compras_stock.

Ventas internas y operaciones:

- Responsable: Eric.
- Funciones: atencion de clientes, carga de pedidos, coordinacion con deposito, gestion comercial interna y linea de cigarrillos/tabaco.
- Permiso sugerido: ventas_internas.

Preventa:

- Responsable inicial: Kevin.
- Funciones: visitas, pedidos, alta de nuevos clientes, relevamiento comercial y desarrollo de cartera.
- Permiso sugerido: preventista.

Logistica y distribucion:

- Repartidor principal: Eduardo.
- Repartidor auxiliar: Manuel.
- Funciones: entrega, cobranza, rendicion y control de entregas.
- Permiso sugerido: reparto.

Catalogo y apoyo comercial:

- Responsable: Tomas Demarchi.
- Funciones: catalogo digital, capacitacion, material comercial y apoyo a clientes.
- Permiso sugerido: catalogo.

## Problemas actuales

- Informacion dispersa entre sistema actual, Excel, WhatsApp y Google Drive.
- Clientes, stock, precios, ventas y saldos duplicados.
- Procesos manuales en cobranzas, proveedores, bancos, rutas y rendiciones.
- Sin indicadores confiables en tiempo real.
- Control de stock con diferencias semanales entre fisico y sistema.
- Proveedores sin cartera desarrollada en el sistema actual.
- Seguimiento de pedidos pendientes por WhatsApp y planillas.

## Procesos centrales

### Clientes

Datos obligatorios:

- Nombre comercial.
- Razon social.
- CUIT.
- Direccion.
- Telefono.
- Condicion fiscal.
- Forma de pago.

Tipos de cliente:

- Kiosco.
- Despensa.
- Minimercado.
- Mayorista.
- Revendedor.
- Cliente especial.

Consultas necesarias:

- Historial de compras.
- Saldo.
- Frecuencia de compra.
- Ticket promedio.
- Ultima compra.
- Forma de pago.

### Ventas y preventa

Canales actuales:

- Sistema de ventas.
- App de preventistas.
- WhatsApp.
- Telefono.
- Ventas internas.

Reglas:

- Preventista y comercial generan presupuestos.
- Descuentos requieren autorizacion de Martin Lopez.
- Repartos se asignan por zona y recorridos predefinidos.

Reportes comerciales:

- Ventas por vendedor.
- Ventas por zona.
- Facturacion.
- Ticket promedio.
- Clientes activos e inactivos.
- Cumplimiento de objetivos.

### Stock y deposito

Situacion actual:

- Un unico deposito.
- Control fisico y registros manuales.
- Cierre semanal todos los lunes.
- Diferencias frecuentes entre stock fisico y sistema.

Roles:

- Cecilia y deposito controlan recepcion.
- Eric carga en sistema y controla precios.
- Eric/deposito registran egresos por armado.

Indicadores:

- Rotacion.
- Quiebres.
- Cobertura.
- Diferencias de inventario.
- Productos inmovilizados.

### Compras y proveedores

Proceso:

- Ordenes de compra por stock disponible, ventas historicas y experiencia.
- Autorizacion de compras por Martin Lopez.
- Recepcion contra pedido, remito y mercaderia.
- Carga posterior de Eric con control de precios.

Datos indispensables:

- Datos fiscales.
- Listas de precios.
- Condiciones comerciales.
- Plazos de pago.

### Logistica y distribucion

Proceso:

- Recorridos por zonas y dias definidos.
- Entre 2 y 3 vehiculos segun demanda.
- Entregas controladas por remitos, rendiciones y confirmacion del cliente.
- Devoluciones registradas manualmente y reintegradas a stock.

Informacion en tiempo real:

- Ubicacion de vehiculos.
- Entregas realizadas.
- Cobranzas efectuadas.
- Pedidos pendientes.

### Administracion y finanzas

Medios de cobro:

- Efectivo.
- Transferencia bancaria.
- Mercado Pago.
- Cuenta corriente.
- Mercaderia como parte de pago en mayoristas.

Reportes:

- Ingresos.
- Egresos.
- Flujo de caja.
- Cuentas corrientes.
- Analisis de resultados.
- Margen bruto.
- Rentabilidad.

## Prioridad funcional

Prioridad 1:

- Preventa con pedidos desde celular.
- Stock confiable y validacion al cargar pedido.
- Pedidos automaticos a administracion/deposito.
- Clientes con saldo, forma de pago e historial.
- Dashboard con ventas, stock critico, cobranzas y GPS.

Prioridad 2:

- Compras y proveedores.
- Recepcion de mercaderia contra remito.
- Cierre semanal de inventario.
- Rendiciones de reparto.
- Cuentas corrientes completas.

Prioridad 3:

- Rentabilidad y margen.
- Promociones y objetivos.
- Catalogo digital.
- Productividad comercial.
- Reportes gerenciales avanzados.

## Cambios que debe absorber la app actual

- Cambiar el modelo de clientes para incluir CUIT, razon social, condicion fiscal, direccion, telefono, tipo de cliente y forma de pago.
- Separar roles reales: direccion, compras/stock, ventas internas, preventa, deposito/reparto y catalogo.
- Agregar autorizacion de descuentos y compras.
- Agregar proceso de cierre semanal de stock con diferencias.
- Agregar rutas, vehiculos, entregas, devoluciones y rendiciones.
- Agregar medios de pago reales, incluyendo Mercado Pago y mercaderia como parte de pago.
- Agregar proveedores con datos fiscales, listas de precio y condiciones.
- Agregar indicadores: facturacion, margen, caja, cobranzas, rotacion, clientes nuevos, clientes inactivos y productividad.

## Preguntas pendientes para cerrar especificacion

- Cual es el sistema actual de ventas y si se puede exportar clientes/productos/stock.
- Si la facturacion legal se hara dentro del sistema o seguira en sistema externo.
- Como se calculan las comisiones: porcentaje fijo, por zona, por producto, por cobranza o por objetivo.
- Como se valorizan los pagos con mercaderia.
- Si hay listas de precios por cliente, zona o tipo de cliente.
- Si los descuentos tienen limite por vendedor antes de pedir autorizacion.
- Cuales son los dias exactos de reparto por zona.
- Que datos debe tener el remito/hoja de armado.
