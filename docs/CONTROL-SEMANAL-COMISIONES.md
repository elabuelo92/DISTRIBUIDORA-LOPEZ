# Control semanal de comisiones

Estado: implementado localmente, pendiente de despliegue.

El informe existente queda primero en Comisiones bajo el titulo Control semanal de comisiones. El tablero incorpora un acceso directo desde su herramienta Comisiones.

## Uso

1. Seleccionar todos los vendedores o un vendedor.
2. Indicar Desde y Hasta, o usar Esta semana / Semana anterior (lunes a domingo).
3. Consultar el resumen por vendedor y el detalle por pedido y producto.
4. Exportar con Sabana Excel (XLSX) o Sabana PDF.
5. Para controlar pagos, seleccionar un vendedor: se muestran devengado, pagado y saldo pendiente, junto con el historial existente.

El periodo corresponde a las comisiones de los pedidos del rango seleccionado. Pagado representa pagos aplicados a esas comisiones; no debe interpretarse como un reporte de movimientos bancarios realizados entre esas fechas.

No se modificaron reglas de calculo, comisiones historicas, pedidos ni pagos. Las exportaciones reutilizan el informe existente.

## Verificacion local

- Rangos semanales: lunes, domingo, semana anterior y cambio de anio.
- Pruebas existentes del informe de ventas/comisiones y cuenta de vendedor.
- Navegador: semana 21/09/2026 a 27/09/2026, 100 pedidos sinteticos, bruto 995000, comision 29850 al 3%.
- Vendedor individual: devengado 29850, pagado 0, saldo 29850.
- No se registraron pagos ni se altero produccion durante la prueba.
