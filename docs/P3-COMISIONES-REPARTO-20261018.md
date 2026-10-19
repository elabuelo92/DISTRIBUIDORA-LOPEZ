# P3: consulta de comisiones de reparto

Version preparada: 8790-172. No modificar ni recalcular importes historicos o liquidados.

## Fuente y alcance

- Fuente exclusiva: `order.commissions.driver`, incluyendo pedidos archivados; deduplicacion por codigo, prevalece el activo.
- Fecha del periodo: `order.commissions.calculatedAt`, presentada como fecha de calculo, no fecha de pago o de venta.
- Beneficiario: nombre guardado en el bloque. No asignar automaticamente nombres administrativos a un repartidor distinto.
- Reporte en Comisiones: filtro por repartidor, desde/hasta, resumen por usuario, detalle por pedido y Excel numerico.
- Total registrado no representa saldo pendiente. No se interpretan marcas de liquidacion comercial como liquidacion de reparto.
- No se crean endpoints ni procesos de liquidacion, ni se escribe estado al consultar/exportar.
- Sin fecha o importe valido: advertencia y listado de excepciones en Excel, nunca reemplazo silencioso por cero.
- Detalle inicialmente plegado; pagina de 50 filas, exportacion completa del filtro.

## Evidencia previa

Inspeccion SSH de solo lectura: 1976 pedidos unicos, 1057 con bloque de reparto atribuido. Nombres registrados: Dispositivo Reparto 1 (572), reparto2 (449), Administracion 2 (36). Los 412 pedidos con marca generica de liquidacion no se modifican ni se consideran pagos al repartidor.

## Pruebas

- `smoke-driver-commission-report.js`: datos congelados, importes y marcas de liquidacion intactos; filtros, cero registrado, duplicados, identidades, fechas Argentina, valores invalidos, archivo XLSX real numerico.
- `smoke-statistics-period.js`: regresion P1, fechas, CMV y XLSX.
- Prueba visual aislada del componente con markup/render reales y datos ficticios: resumen y apertura del detalle, filtro Reparto Demo 2 = 400. No se uso una sesion real ni una operacion financiera.
- `node --check app.js`; prueba de cache/version antes de publicar.

## Checklist operativo posterior

1. Administracion: abrir Comisiones y localizar Comisiones de reparto.
2. Elegir un repartidor y un periodo; contrastar pedidos e importes guardados.
3. Desplegar detalle por pedido y exportar Excel; controlar total general y filtros.
4. No registrar pagos desde el reporte: es consulta de importes generados, no un circuito nuevo de liquidacion.

Despliegue pendiente al redactar. Exigir respaldo, comparacion completa de datos/usuarios y salud/licencia/integridad antes de confirmar publicacion. La revision visual con usuario de produccion queda pendiente si no hay sesion administrativa disponible.
