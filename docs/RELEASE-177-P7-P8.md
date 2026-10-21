# Version 8790-177 - P7 y P8

## Incluido

- P7: cliente paginado por identificador exacto, errores de horario visibles, bloqueo de doble envio/cierre mientras guarda, confirmacion, cierre y refresco.
- P8: ordenes de cobro independientes, administracion por ID y saldo, bolsa o ruta existente, repartidor asignado, GPS actual, parcial efectivo/transferencia, comprobante y conciliacion existente.
- Finalizar visita no cobrada/parcial conserva deuda; cerrar ruta exige visitas finalizadas. Sin stock, ventas ni comisiones.
- Manifiestos por ruta/dia separan ordenes de cobro y entregas. Importes numericos conservados.
- Proteccion contra reenvios y sincronizacion general; auditoria de cada operacion y archivos nuevos incluidos en integridad.

## Evidencia local

20 suites aprobadas: revision P1-P8, HTTP concurrente, cuentas, stock, comisiones, horarios, manifiestos. Cache version 177 aprobada adicionalmente.
Demo sintetica movil: alta en bolsa y ruta, cobro 100, total cobrado 1000, total vendido 0, pendiente 0. Formulario sin efectivo predeterminado. Captura P8-demo-movil.png.
No se utilizaron datos reales ni se aplicaron ajustes reales durante las pruebas.

## Despliegue

Autorizado por usuario. Respaldo de data antes de publicar, integridad regenerada y reinicio solo del ERP. Comparacion completa de estado y usuarios requerida. Registrar resultado en acta posterior, no considerar este documento prueba de publicacion.

P9-P11 no incluidos. Regla 1%/3% sigue aplazada. No se migran pedidos anteriores de Saldo a cobrar a ordenes nuevas.
