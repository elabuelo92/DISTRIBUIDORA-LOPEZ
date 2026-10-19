# Prioridades recibidas el 18 de octubre de 2026

## Actualizacion posterior al despliegue

P1 fue publicado en 8790-170 y P2 (conciliacion/carga inicial protegida) en 8790-171, commit cb1cf2e, el domingo 18/10 por la noche en Argentina. Se conserva abajo el listado previo como antecedente, no como estado actual de P1/P2. Detalle y pruebas: P2-STOCK-PRUEBAS-20261018.md.

El usuario confirmo ajustes por diferencias. No se aplicaron conteos reales. Sobrestock aplazado por pedido expreso. La revision visual administrativa de P1 sigue aplazada; la prueba visual operativa de P2 tambien queda pendiente.

No se autoriza modificar historicos ni recalcular liquidaciones. Cambios en el clon revisado, sin desplegar. No mezclar con el ajuste de comisiones 1%/3% aplazado por el usuario.

## Estado

- P1: implementado localmente con corte autorizado, pendiente de despliegue. Periodo semanal por defecto (lunes hasta hoy, Argentina), ventas, productos, vendedores y Excel. Exclusion cancelados/rechazados/anulados y ordenes de cobro identificadas, incluido producto legado Saldo a cobrar. Deduplicacion activos/archivados por codigo. CMV y ganancia bruta no disponibles si falta costo historico; no se usa costo actual como sustituto. Captura persistente para nuevas lineas, fecha de inicio, devoluciones y listado de faltantes. Pruebas de motor, HTTP y XLSX real aprobadas; pantalla movil verificada en demo ficticia.
- P2: pendiente de aprobar procedimiento de carga inicial. Revisar movimientos y conciliacion existentes antes de implementar.
- P3: pendiente auditar reporte de comisiones ya guardadas de repartidores.
- P4: pendiente alcance Todos, identidades Kevin/Ruggero, fechas, filtros, confirmacion y exportaciones. No cambiar reglas reales por este diagnostico.
- P5: pendiente cuenta corriente vs diferencia de caja; caso Fernanda Maldonado.
- P6: pendiente cancelacion administrativa de No entregado; PED-3776 Diego Godoy. No ajustar stock real sin reconstruir salida/reserva/devolucion y compensaciones previas.
- P7: pendiente edicion por ID, horarios, confirmacion, cierre y scroll.
- P8: pendiente orden de cobro separada sin stock, ventas ni comisiones; revisar modelos existentes antes de crear entidad.
- P9: pendiente aprobacion de flujo antes de codificar correcciones de cobranza.
- P10: pendiente anulacion trazable de remitos, detalle desde proveedor y mantener bloque abierto. Fotos multiples ya publicadas en release anterior; verificar reutilizacion.
- P11: pendiente columna Descuento % sin alterar precios ni calculos y nombres de ruta manuales. Este pedido cambia la decision anterior de nombres automaticos; preservar historicos y aplicar nueva presentacion sin renombrar datos masivamente.
- GPS cliente sin GPS: prueba solamente. Precarga de recepcion y hoja de reparto: posteriores.

## Propuesta P2: carga inicial

1. Respaldo y corte con fecha, responsables y movimientos pendientes identificados.
2. Exportar existencias, reservas y transito. Contar por codigo exacto y unidad base; no reemplazar catalogo ni cargar todo como remito.
3. Previsualizar diferencia conteo menos stock fisico registrado. Revisar negativos, duplicados, unidades y reservas mayores al fisico.
4. Aprobar un lote identificado. Registrar solo diferencias como ajustes con usuario, fecha, motivo, conteo y valor anterior; cada linea se aplica una sola vez.
5. Comparar antes/despues, conservar reservas y no producir deuda de proveedor ni ventas. Reversion mediante contramovimiento, no borrado.

## Propuesta P9: cobranzas corregidas

1. Administracion selecciona cobro original por ID y consulta cliente, pedido/ruta, caja, comprobantes y liquidaciones relacionadas.
2. Indica medio/importe correcto y motivo. Previsualizar impacto en caja, transferencia y cuenta corriente; revisar estados bancarios y cajas cerradas.
3. Una transaccion registra reverso vinculado al original y nuevo movimiento, con identificador de operacion unico y control de version. El original permanece inmutable.
4. Cierre a ciegas del repartidor no se altera ni revela expectativas. Correcciones de cajas cerradas quedan como ajustes administrativos relacionados, no reaperturas silenciosas.
5. Pruebas de doble clic, concurrencia, pago parcial, cambio de medio, transferencia validada y diferencias. No modificar cobros reales hasta aprobar el flujo y verificar pruebas.

## Fuente de CMV pendiente

La inspeccion de solo lectura en produccion el 18/10 encontro 1976 pedidos, 13452 lineas y cero snapshots de costo. El log actual contiene 461 eventos de actualizacion de costo/listas para 212 productos; esto no acredita cobertura completa ni continuidad para todo el historico.

El usuario autorizo un corte sin reconstruccion retroactiva al no disponer de listas historicas. Implementado localmente:
- Cada nueva linea guarda costo del catalogo y fecha de captura; no usa costo enviado por el navegador.
- La primera captura registra `costHistory.startedAt` persistente. Se conserva en ediciones y reinicios, sin fijar una fecha ficticia de despliegue.
- Ediciones conservan snapshots existentes, cantidades nuevas usan el mismo costo; productos agregados capturan el costo de ese momento. Lineas historicas existentes sin costo siguen desconocidas.
- CMV usa unidades menos devoluciones. Ganancia bruta resta devoluciones a ventas y luego CMV. No es ganancia neta ni un motor FIFO/promedio ponderado de compras.
- Un periodo mixto con costos faltantes mantiene CMV/ganancia no disponibles; Excel detalla pedido, fecha, producto y unidades pendientes. No se rellena con ceros ni catalogo actual.
- Fecha de inicio del registro visible en pantalla y Excel. Antes de la primera captura indica pendiente.

Pantalla movil verificada en demo: venta 10000, CMV 3000, ganancia bruta 7000 y fecha de corte visible. Pendiente de publicacion y validacion posterior en produccion; no dar por desplegado. No copiar datos de demo a produccion.
